# STATUS.md

## MVP Milestone Checklist

- [x] 1. Git repo with Next.js 13 skeleton (`pnpm dev` shows welcome page)
- [x] 2. Upstash KV created (`terminalfun`) with Eviction OFF
- [x] 3. `.env` with `UPSTASH_REST_URL`, `UPSTASH_REST_TOKEN`, `HELIUS` (not committed)
- [x] 4. `/app/api/cron/route.ts` logic implemented
- [x] 5. `vercel.json` with `"crons"` entry
- [x] 6. `/app/api/overview/route.ts` + caching headers
- [x] 7. React table page using TanStack & Recharts (UI scaffolded, auto-refresh)
- [ ] 8. Prod deploy (`main`)
- [ ] 9. Load test 10 req/s for 5 min via k6
- [ ] 10. Write README with scale-up instructions

All code and infra so far is public-repo safe, with secrets in `.env` and `.gitignore` enforced.

---

- Unit tests and timing wrappers for API performance will be added before milestone 9.
- Awaiting production deploy and load test steps next.
