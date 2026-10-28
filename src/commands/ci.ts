import type { Command } from "commander";
import { brand } from "../core/brand.js";
import { CliError, Exit } from "../core/errors.js";
import { tr } from "../core/i18n.js";
import { c, emit, info, ok, table } from "../core/output.js";
import { get, post, put } from "../core/http.js";
import { confirm, hasTty } from "../core/prompt.js";
import { requirePerson } from "../auth/session.js";
import { parseDuration } from "./keys.js";
import { registerCiPolicy } from "./ci-policy.js";

interface CiTrust {
  id: string;
  name: string;
  provider: string;
  repository: string;
  refPattern: string;
  environment?: string | null;
  expiresAt?: string | null;
  revokedAt?: string | null;
  lastUsedAt?: string | null;
  createdAt: string;
  writePermissions?: string[];
  maxWritesPerRun?: number;
  firstWriteAt?: string | null;
}

interface WritePermission {
  code: string;
  name: string;
  module: string;
  action: string;
  allowed: boolean;
  reason?: string | null;
}

const splitCodes = (v?: string) => (v ?? "").split(/[,\s]+/).map((x) => x.trim()).filter(Boolean);
const writeLabel = (t: CiTrust) => (t.writePermissions?.length ? `${t.writePermissions.length} ${tr("quyền", "perms")} · ≤${t.maxWritesPerRun}/${tr("lượt", "run")}` : tr("chỉ đọc", "read-only"));

async function findTrust(id: string): Promise<CiTrust> {
  const t = (await get<CiTrust[]>("/iam/ci-trusts")).find((x) => x.id.startsWith(id) || x.repository === id);
  if (!t) throw new CliError(tr("Không thấy khai báo này.", "Not found."), Exit.notFound);
  return t;
}

const when = (s?: string | null) => (s ? s.slice(0, 16).replace("T", " ") : "—");

export function workflowSample(repo = "acme/web", ws = "my-workspace"): string {
  const b = brand();
  return `# .github/workflows/report.yml  (${repo})
permissions:
  id-token: write   # cho phép lấy token OIDC — không cần secret nào
  contents: read
jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - run: npx -y ${b.pkg} login --ci --workspace ${ws}
      - run: npx -y ${b.pkg} -p "${tr(b.example.vi, b.example.en)}" --json > report.json`;
}

/** Mẫu CI có GHI: chỉ chạy được sau khi quản trị mở phạm vi (ci trust set --allow … --max-per-run …). */
export function workflowWriteSample(repo = "acme/web", ws = "my-workspace"): string {
  const b = brand();
  return `# .github/workflows/follow-up.yml  (${repo})
# ${tr("Ghi chỉ trong phạm vi đã duyệt trước; ngoài phạm vi thì để lại đề xuất chờ người duyệt (mã thoát 7).", "Writes only within the pre-approved scope; anything else stays a proposal for a person (exit code 7).")}
permissions:
  id-token: write
  contents: read
jobs:
  follow-up:
    runs-on: ubuntu-latest
    environment: production   # ${tr("khớp --environment của ci trust", "matches the ci trust --environment")}
    steps:
      - run: npx -y ${b.pkg} login --ci --workspace ${ws}
      - run: npx -y ${b.pkg} -p "${tr("tạo việc gọi lại cho khách quá hạn chăm sóc 7 ngày", "create call-back tasks for customers not contacted in 7 days")}" --mode auto`;
}

export function registerCi(program: Command): void {
  const ci = program.command("ci").description(tr("đăng nhập từ CI không cần bí mật (OIDC)", "secretless CI login (OIDC)"));
  const trust = ci.command("trust").description(tr("kho CI được phép đăng nhập workspace này", "CI repositories allowed to log in to this workspace"));
  trust.hook("preAction", async () => {
    if (brand().notYet?.includes("ci")) {
      const { notYetError } = await import("../core/errors.js");
      throw notYetError(tr(`${brand().name} chưa mở đăng nhập CI bằng OIDC`, `${brand().name} does not offer CI OIDC login yet`), tr(`dùng khoá API: ${brand().envPrefix}_API_KEY`, `use an API key: ${brand().envPrefix}_API_KEY`));
    }
    await requirePerson();
  });

  trust.command("list", { isDefault: true }).action(async () => {
    const list = await get<CiTrust[]>("/iam/ci-trusts");
    emit(list, () => info(list.length
      ? table(["ID", tr("Kho", "Repository"), "Ref", "Env", tr("Ghi", "Writes"), tr("Dùng lần cuối", "Last used"), ""], list.map((t) => [
          t.id.slice(0, 8), `${t.provider}:${t.repository}`, t.refPattern, t.environment ?? "", writeLabel(t), when(t.lastUsedAt), t.revokedAt ? c.red(tr("đã thu hồi", "revoked")) : c.green("●"),
        ]))
      : tr(`Chưa có kho nào. Thêm: ${brand().bin} ci trust add --repo owner/repo`, `None yet. Add one: ${brand().bin} ci trust add --repo owner/repo`)));
  });

  trust.command("add")
    .description(tr("cho một kho đăng nhập (token đứng tên bạn, sống 15 phút)", "allow a repository to log in (tokens act as you, live 15 minutes)"))
    .requiredOption("--repo <owner/repo>")
    .option("--provider <p>", "github | gitlab", "github")
    .option("--ref <ref>", tr("nhánh hoặc tiền tố tag, vd main · refs/tags/v*", "branch or tag prefix, e.g. main · refs/tags/v*"), "main")
    .option("--environment <name>", tr("environment GitHub bắt buộc (khuyên dùng cho nhánh chính)", "required GitHub environment (recommended for the main branch)"))
    .option("--expires <dur>", tr("thời hạn: 90d, 1y", "lifetime: 90d, 1y"))
    .option("--name <name>")
    .option("--allow <codes>", tr("mã quyền GHI được tự ghi, cách nhau dấu phẩy (xem: ci trust permissions). Bỏ trống = chỉ đọc + đề xuất", "WRITE permission codes the CI may use on its own, comma-separated (see: ci trust permissions). Empty = read + propose only"))
    .option("--max-per-run <n>", tr("trần số dòng tự ghi mỗi lượt chạy (bắt buộc khi --allow, tối đa 500)", "max rows written per CI run (required with --allow, up to 500)"))
    .action(async (o: { repo: string; provider: string; ref: string; environment?: string; expires?: string; name?: string; allow?: string; maxPerRun?: string }) => {
      const allow = splitCodes(o.allow);
      if (allow.length && !o.maxPerRun) throw new CliError(tr("Có --allow thì cần --max-per-run (vd 50).", "--allow needs --max-per-run (e.g. 50)."), Exit.usage);
      const t = await post<CiTrust>("/iam/ci-trusts", {
        provider: o.provider, repository: o.repo, refPattern: o.ref, environment: o.environment, name: o.name,
        expiresAt: o.expires ? parseDuration(o.expires) : null,
        writePermissions: allow, maxWritesPerRun: allow.length ? Number(o.maxPerRun) : 0,
      });
      emit(t, () => {
        ok(tr(`Đã cho ${t.provider}:${t.repository} (${t.refPattern}) đăng nhập`, `Allowed ${t.provider}:${t.repository} (${t.refPattern})`));
        info(`  ${tr("Ghi", "Writes")}: ${writeLabel(t)}`);
        info(c.dim(tr("\nMẫu workflow:", "\nSample workflow:")));
        info(t.writePermissions?.length ? workflowWriteSample(t.repository) : workflowSample(t.repository));
      });
    });

  // Phạm vi tự ghi theo từng kho là của nền tảng mặc định; NextFarm có chính sách riêng (ci policy, bên dưới).
  if (brand().platform !== "nextfarm") registerTrustWritePolicy(trust);

  trust.command("revoke <id>").description(tr("thu hồi (có hiệu lực ngay)", "revoke (immediate)")).action(async (id: string) => {
    const t = await findTrust(id);
    if (hasTty() && !(await confirm(tr(`Thu hồi ${t.repository}?`, `Revoke ${t.repository}?`)))) return;
    await post(`/iam/ci-trusts/${t.id}/revoke`, {});
    ok(tr("Đã thu hồi.", "Revoked."));
  });

  // Pre-approval policies exist on NextFarm only; elsewhere CI keeps printing a link for every write.
  if (brand().platform === "nextfarm") registerCiPolicy(ci);

  ci.command("example").description(tr("in mẫu workflow GitHub Actions", "print a sample GitHub Actions workflow"))
    .option("--repo <owner/repo>").option("--workspace <code>")
    .option("--write", tr("mẫu có tự ghi (cần ci trust set --allow)", "sample that writes (needs ci trust set --allow)"))
    .action((o: { repo?: string; workspace?: string; write?: boolean }) => info(o.write ? workflowWriteSample(o.repo, o.workspace) : workflowSample(o.repo, o.workspace)));
}

function registerTrustWritePolicy(trust: Command): void {
  trust.command("set <id>")
    .description(tr("đặt phạm vi tự ghi của một kho (chỉ người khai báo mới mở được)", "set what a repository may write on its own (only the declarer can open writes)"))
    .option("--allow <codes>", tr("mã quyền GHI, cách nhau dấu phẩy; '' = về chỉ đọc", "WRITE permission codes, comma-separated; '' = back to read-only"))
    .option("--max-per-run <n>", tr("trần số dòng mỗi lượt chạy (1–500)", "max rows per run (1–500)"))
    .option("--environment <name>", tr("environment GitHub bắt buộc", "required GitHub environment"))
    .option("--read-only", tr("đóng mọi quyền ghi", "close all writes"))
    .action(async (id: string, o: { allow?: string; maxPerRun?: string; environment?: string; readOnly?: boolean }) => {
      const cur = await findTrust(id);
      const allow = o.readOnly ? [] : o.allow !== undefined ? splitCodes(o.allow) : cur.writePermissions ?? [];
      const max = allow.length ? Number(o.maxPerRun ?? cur.maxWritesPerRun ?? 0) : 0;
      if (allow.length && !(max > 0)) throw new CliError(tr("Cần --max-per-run (vd 50).", "Pass --max-per-run (e.g. 50)."), Exit.usage);
      if (allow.length && hasTty()) {
        info(tr(`Kho ${cur.repository} sẽ được TỰ GHI, đứng tên bạn, tối đa ${max} dòng mỗi lượt chạy:`, `${cur.repository} will WRITE on its own, as you, up to ${max} rows per run:`));
        for (const code of allow) info(`  · ${code}`);
        if (!(await confirm(tr("Đồng ý?", "Agree?")))) return;
      }
      const t = await put<CiTrust>(`/iam/ci-trusts/${cur.id}/write-policy`, {
        writePermissions: allow, maxWritesPerRun: max, environment: o.environment ?? cur.environment ?? null,
      });
      emit(t, () => ok(`${t.provider}:${t.repository} · ${writeLabel(t)}${t.environment ? ` · env ${t.environment}` : ""}`));
    });

  trust.command("permissions").description(tr("quyền ghi có thể giao cho CI (kèm lý do bị cấm)", "write permissions you can give a CI (with reasons when not allowed)"))
    .option("--all", tr("hiện cả quyền bị cấm cứng", "include hard-blocked permissions"))
    .action(async (o: { all?: boolean }) => {
      const list = await get<WritePermission[]>("/iam/ci-trusts/write-permissions");
      const shown = o.all ? list : list.filter((p) => p.allowed);
      emit(shown, () => info(table([tr("Mã", "Code"), tr("Tên", "Name"), ""], shown.map((p) => [
        p.code, p.name, p.allowed ? c.green("✓") : c.dim(p.reason ?? ""),
      ]))));
    });
}
