# Audit Server

Express server that triggers Unlighthouse performance audits for Terraria Wars.

## Setup

```bash
pnpm install
```

## Email Configuration

To receive audit reports via Gmail:

1. Copy `.env.example` to `.env`
2. Configure your Gmail credentials:

```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
GMAIL_TO=recipient@example.com
```

**Getting an App Password:**
1. Go to [Google Account](https://myaccount.google.com) > Security
2. Enable 2-Step Verification if not already enabled
3. Go to Security > 2-Step Verification > App passwords
4. Generate a new app password for "Mail"

## Running

```bash
# Development mode (with hot reload)
pnpm dev

# Production mode
pnpm start
```

## API Endpoints

### POST `/audit/terrariawars`

Trigger an Unlighthouse audit.

**Request Body:**
```json
{
  "password": "123",
  "url": "https://terrariawars.com"  // optional
}
```

**Responses:**
- `200`: Audit started successfully
- `400`: Missing password
- `401`: Invalid password

**Example:**
```bash
curl -X POST http://localhost:3000/audit/terrariawars \
  -H "Content-Type: application/json" \
  -d '{"password": "123"}'
```

### GET `/health`

Health check endpoint.

```bash
curl http://localhost:3000/health
```

## Output

Audit results are saved to `.unlighthouse/` directory with:
- HTML report
- JSON data
- CSV export

**Email Report** (if configured):
- Overall Performance and SEO scores
- Per-page breakdown
- Pages failing the budget threshold (Performance < 80, SEO < 90)

# lighthouse-aduit-server
