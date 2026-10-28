// <brand:nextfarm>
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { brand, setBrand } from "../src/core/brand.js";

const onDefaultPlatform = () => { setBrand("nextx"); return brand().platform === "nextx"; };

test("bản nextfarm: không chữ NextX/CRM, có lệnh nông nghiệp, không có lệnh riêng NextX", async () => {
  setBrand("nextfarm");
  const { buildProgram } = await import("../src/program.js");
  const { helpTree } = await import("../src/commands/help.js");
  const tree = helpTree(buildProgram());
  const text = JSON.stringify(tree);
  assert.equal(/NextX/.test(text), false, text.match(/.{40}NextX.{40}/)?.[0]);
  assert.equal(/\bCRM\b/.test(text), false, text.match(/.{40}CRM.{40}/)?.[0]);
  const slash = tree.slashCommands.map((s) => s.name);
  for (const n of ["/sau-benh", "/thoi-tiet", "/ban-tin", "/undo", "/why"]) assert.ok(slash.includes(n), `thiếu ${n}`);
  for (const n of ["/journal", "/pending", "/library", "/agent", "/support"]) assert.ok(!slash.includes(n), `thừa ${n}`);
  setBrand("nextx");
});

test("đổi khoá snake/camel chỉ cho dịch vụ snake của NextFarm, trừ ba đường ngoại lệ", async () => {
  const { snakeOnWire, snakeKeys, camelKeys } = await import("../src/core/case.js");
  setBrand("nextfarm");
  assert.equal(snakeOnWire("https://api-dev.nextfarm.vn/api/v1/iam/auth/select-workspace"), true);
  assert.equal(snakeOnWire("https://api-dev.nextfarm.vn/api/v1/webhook/endpoints"), true);
  assert.equal(snakeOnWire("https://api-dev.nextfarm.vn/api/v1/office/tables/x/records"), false);
  assert.equal(snakeOnWire("https://api-dev.nextfarm.vn/api/v1/finance/receipts"), false);
  assert.equal(snakeOnWire("https://api-dev.nextfarm.vn/api/v1/iam/automation-rules"), false);
  assert.equal(snakeOnWire("https://api-dev.nextfarm.vn/api/v1/gis/import/rows"), false);
  assert.deepEqual(snakeKeys({ workspaceId: "w", eventTypes: ["a"], nested: [{ fullName: "B" }] }), { workspace_id: "w", event_types: ["a"], nested: [{ full_name: "B" }] });
  assert.deepEqual(camelKeys({ pre_auth_token: "t", workspaces: [{ primary_group_name: "owner" }] }), { preAuthToken: "t", workspaces: [{ primaryGroupName: "owner" }] });
  setBrand("nextx");
});

test("làm mới phiên gửi refresh_token với NextFarm (IAM bỏ qua refreshToken ⇒ 401 ⇒ CLI xoá phiên)", async () => {
  const { refreshBody } = await import("../src/auth/session.js");
  setBrand("nextfarm");
  assert.equal(refreshBody("https://api-dev.nextfarm.vn/api/v1/iam/auth/refresh-token", "r"), '{"refresh_token":"r"}');
  setBrand("nextx");
});

test("NextX làm mới phiên vẫn gửi refreshToken", { skip: !onDefaultPlatform() }, async () => {
  const { refreshBody } = await import("../src/auth/session.js");
  assert.equal(refreshBody("https://api.nextx.vn/api/v1/iam/auth/refresh-token", "r"), '{"refreshToken":"r"}');
});

test("mức rủi ro NextFarm theo từng dòng: thiết bị, tiền, ghi lớn, thường", async () => {
  const { riskOfNextFarm } = await import("../src/ai/nextfarm.js");
  assert.equal(riskOfNextFarm("automation.enable", {}), "device");
  assert.equal(riskOfNextFarm("farm.entries", { entries: [{ kind: "field_log" }, { kind: "iot_output_set" }] }), "device");
  assert.equal(riskOfNextFarm("farm.entries", { core: { entries: [{ kind: "cash" }] } }), "finance");
  assert.equal(riskOfNextFarm("farm.entries", { entries: Array.from({ length: 21 }, () => ({ kind: "field_log" })) }), "large");
  assert.equal(riskOfNextFarm("farm.entries", { entries: [{ kind: "season_close" }] }), "large");
  assert.equal(riskOfNextFarm("farm.entries", { entries: [{ kind: "irrigation_run" }] }), "normal");
});

test("hạn mức tuần mở lại 00:00 thứ Hai giờ Việt Nam", async () => {
  const { nextMondayVietnam } = await import("../src/ai/nextfarm.js");
  assert.equal(nextMondayVietnam(new Date("2026-10-28T16:00:00Z")), "2026-11-02T00:00:00+07:00"); // thứ Tư 23:00 VN
  assert.equal(nextMondayVietnam(new Date("2026-11-01T18:00:00Z")), "2026-11-09T00:00:00+07:00"); // đúng 01:00 thứ Hai VN
  assert.equal(nextMondayVietnam(new Date("2026-11-01T16:30:00Z")), "2026-11-02T00:00:00+07:00"); // Chủ nhật 23:30 VN
});

test("kiểm chữ ký X-Nextfarm-Signature (sha256=HMAC(ts.body))", async () => {
  setBrand("nextfarm");
  const { verifySignature } = await import("../src/commands/webhooks.js");
  const secret = "whsec_" + Buffer.alloc(32, 7).toString("base64");
  const ts = String(Math.floor(Date.now() / 1000));
  const body = '{"type":"gis.parcel.created"}';
  const sig = "sha256=" + createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex");
  assert.equal(verifySignature(secret, body, { "X-Nextfarm-Signature": sig, "X-Nextfarm-Timestamp": ts }).ok, true);
  assert.equal(verifySignature(secret, body + " ", { "X-Nextfarm-Signature": sig, "X-Nextfarm-Timestamp": ts }).ok, false);
  setBrand("nextx");
});
// </brand:nextfarm>
