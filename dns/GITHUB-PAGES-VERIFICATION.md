# GitHub Pages Verification Setup

This document describes how to verify the `lexdo.uk` custom domain with GitHub Pages for the LexBANK/BSU repository.

## Overview

GitHub requires domain verification to enable GitHub Pages on custom domains. This involves adding a TXT DNS record to prove domain ownership.

## Automated Setup

We provide a script to automate the GitHub Pages verification process with Cloudflare DNS:

```bash
./scripts/setup_github_pages_verification.sh <CLOUDFLARE_API_TOKEN> <GITHUB_CHALLENGE_VALUE>
```

### Prerequisites

- Cloudflare API token with DNS edit permissions
- GitHub Pages challenge value from the repository settings
- Required commands: `curl`, `dig`, `python3`

### Getting the Challenge Value

1. Navigate to [GitHub Pages Settings](https://github.com/LexBANK/BSU/settings/pages)
2. Add your custom domain (`www.lexdo.uk` - note: the CNAME file in docs/ already contains this)
3. GitHub will generate a TXT record challenge value for `_github-pages-challenge-LexBANK.lexdo.uk`
4. Copy the challenge value (it will be a hex string like `abc123def456...`)

### Running the Script

```bash
# Option 1: Command line arguments
./scripts/setup_github_pages_verification.sh your_cloudflare_token abc123challenge

# Option 2: Environment variables
CLOUDFLARE_API_TOKEN=your_token \
GITHUB_PAGES_CHALLENGE=abc123challenge \
./scripts/setup_github_pages_verification.sh
```

### What the Script Does

1. **Validates API Token**: Verifies the Cloudflare API token is valid
2. **Checks Existing Records**: Looks for any existing TXT record for the challenge
3. **Creates TXT Record**: Adds the `_github-pages-challenge-LexBANK.lexdo.uk` TXT record if needed
4. **Waits for Propagation**: Polls public DNS resolvers (1.1.1.1 and 8.8.8.8) for DNS propagation
5. **Provides Next Steps**: Shows the verification URL to complete the process

## Manual Setup

If you prefer to set up the DNS record manually:

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select the `lexdo.uk` zone
3. Go to DNS settings
4. Add a new TXT record:
   - **Name**: `_github-pages-challenge-LexBANK`
   - **Content**: The challenge value from GitHub Pages settings
   - **TTL**: 1 (Auto)
5. Wait for DNS propagation (usually 1-5 minutes)
6. Return to GitHub Pages settings and click "Verify"

## Verification Status

After DNS propagation, GitHub Pages will automatically verify the domain. You can check the status at:
https://github.com/LexBANK/BSU/settings/pages

## Troubleshooting

### DNS Not Propagating

Wait a few more minutes and try checking with these commands:

```bash
# Check with Cloudflare DNS
dig @1.1.1.1 TXT _github-pages-challenge-LexBANK.lexdo.uk

# Check with Google DNS
dig @8.8.8.8 TXT _github-pages-challenge-LexBANK.lexdo.uk
```

### API Token Issues

Ensure your Cloudflare API token has:
- Zone:DNS:Edit permissions for the `lexdo.uk` zone
- Zone:Zone:Read permissions

### Script Fails

Run the script with bash debug mode:

```bash
bash -x ./scripts/setup_github_pages_verification.sh your_token challenge_value
```

## Related Files

- `/scripts/setup_github_pages_verification.sh` - Automated setup script
- `/dns/lexdo-uk-zone.txt` - Cloudflare DNS zone configuration
- `/docs/CNAME` - GitHub Pages domain configuration
- `/dns/DNS-RECORD-TYPES.md` - DNS record types reference

## References

- [GitHub Pages Custom Domain Documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [Cloudflare DNS Documentation](https://developers.cloudflare.com/dns/)
- [Cloudflare API Documentation](https://developers.cloudflare.com/api/)
