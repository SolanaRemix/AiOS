# AIOS API Reference

## Base URL

```
https://your-domain.com/api
# or locally:
http://localhost:4000/api
```

## Authentication

All protected endpoints require a JWT Bearer token:

```http
Authorization: Bearer <accessToken>
```

Tokens are obtained via `POST /auth/login` and expire in 15 minutes.  
Use `POST /auth/refresh` with the `refreshToken` to get a new access token.

---

## Error Format

All errors return JSON:

```json
{
  "error": "Human-readable message",
  "details": { ... }
}
```

Common HTTP status codes:
- `400` Bad Request – validation failed
- `401` Unauthorized – missing/invalid token
- `403` Forbidden – insufficient role or plan limit
- `404` Not Found
- `429` Too Many Requests – rate limit exceeded
- `500` Internal Server Error

---

## Auth Endpoints

### POST /auth/register

Create a new user account and tenant.

**Request:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "SecurePass123!",
  "tenantName": "Acme Corp"
}
```

**Response `201`:**
```json
{
  "user": { "id": "...", "email": "jane@example.com", "role": "admin" },
  "tenant": { "id": "...", "slug": "acme-corp", "plan": "free" },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

---

### POST /auth/login

**Request:**
```json
{ "email": "jane@example.com", "password": "SecurePass123!" }
```

**Response `200`:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { "id": "...", "role": "admin", "tenantId": "..." }
}
```

---

### GET /auth/me

Returns the currently authenticated user.

**Response `200`:**
```json
{
  "id": "...",
  "email": "jane@example.com",
  "name": "Jane Smith",
  "role": "admin",
  "tenantId": "..."
}
```

---

## Plans

### GET /plans

Returns all active subscription plans with feature gates.

**Response `200`:**
```json
{
  "plans": [
    {
      "id": "plan-free",
      "name": "free",
      "displayName": "Free",
      "priceMonthly": 0,
      "features": ["3 projects", "1 agent", "10K tokens/month"],
      "limits": { "max_projects": 3, "max_agents": 1, "tokensPerMonth": 10000 },
      "featureGates": [
        { "feature": "federation", "value": "false" },
        { "feature": "max_projects", "value": "3" }
      ]
    }
  ]
}
```

---

## Projects

### GET /projects

List all projects for the current tenant.

**Query params:** `page`, `limit`, `status`

### POST /projects

**Request:**
```json
{
  "name": "My API Project",
  "description": "Optional description"
}
```

**Response `201`:** Project object

---

## Jobs

### POST /jobs

Submit an AI agent job.

**Request:**
```json
{
  "agentType": "builder",
  "input": "Create a REST API endpoint for user authentication with JWT",
  "projectId": "optional-project-id",
  "title": "Build auth endpoint",
  "priority": 5
}
```

`agentType` options: `builder` | `debugger` | `tester` | `deployment` | `refactor` | `security` | `designer` | `analytics` | `devops`

**Response `202`:**
```json
{
  "jobId": "clxxx...",
  "queueJobId": "42",
  "status": "queued"
}
```

---

### GET /jobs/:id

Get full job details including execution logs.

**Response `200`:**
```json
{
  "id": "...",
  "status": "completed",
  "agentType": "builder",
  "input": "...",
  "output": "// Generated code...",
  "tokens": 1200,
  "cost": 0.036,
  "durationMs": 5200,
  "logs": [
    { "level": "info", "message": "Job started", "createdAt": "..." }
  ]
}
```

---

### POST /jobs/:id/cancel

Cancel a queued or running job.

---

## Federation

### POST /federation/chat

Send a message to the best-selected LLM.

**Request:**
```json
{
  "message": "Explain the SOLID principles with examples",
  "taskType": "explanation",
  "model": "gpt-4-turbo"
}
```

**Response `200`:**
```json
{
  "content": "...",
  "model": "gpt-4-turbo-preview",
  "tokens": 450,
  "cost": 0.0135,
  "provider": "openai"
}
```

---

## Billing

### POST /billing/create-subscription

**Request:**
```json
{ "plan": "pro", "paymentMethodId": "pm_..." }
```

### GET /billing/usage

Get token usage and cost breakdown.

**Query params:** `from` (ISO date), `to` (ISO date)

---

## Rate Limits

| Endpoint Group | Limit |
|---|---|
| Auth (login/register) | 10 req/15min |
| Password reset | 3 req/hour |
| API (general) | 100 req/min |
| Agent/Job submission | 20 req/min |
| Federation | 30 req/min |
| Stripe webhook | 100 req/min |
