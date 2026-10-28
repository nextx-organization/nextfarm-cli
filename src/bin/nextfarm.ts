#!/usr/bin/env node
import { setBrand } from "../core/brand.js";
setBrand("nextfarm");
const { main } = await import("../main.js");
await main(process.argv);
