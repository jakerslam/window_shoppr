# Custom Domain and SSL

## Target domain
- Primary: `windowshoppr.com`
- Optional subdomain: `www.windowshoppr.com`

## Static hosting (GitHub Pages)
1. Ensure `public/CNAME` contains the production domain.
2. Configure DNS records:
   - `A` records for apex domain pointing to GitHub Pages IPs.
   - `CNAME` record for `www` pointing to `<username>.github.io`.
3. In GitHub repository Settings -> Pages:
   - Set custom domain to `windowshoppr.com`.
   - Enable **Enforce HTTPS**.
4. Validate cert issuance (can take up to 24h) and HTTPS redirect behavior.

## Runtime hosting (Vercel)
1. Add `windowshoppr.com` and `www.windowshoppr.com` in Vercel Domains.
2. Point DNS according to Vercel instructions (`A` / `CNAME`).
3. Verify automatic SSL cert provisioning and renewal in Vercel dashboard.
4. Set canonical domain redirect (www -> apex or apex -> www).

## Verification checklist
- `https://windowshoppr.com` returns `200`.
- `http://windowshoppr.com` redirects to HTTPS.
- Certificate is valid and not near expiry.
- Canonical host redirect is enforced.
- `public/CNAME` matches configured apex domain.
