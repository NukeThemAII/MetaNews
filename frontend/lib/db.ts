import { Pool } from "pg";

// Database connection pool
// Uses DATABASE_URL from environment or constructs from individual vars
const connectionString = process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

// Export for use in API routes and server components
export default pool;

// Query helper with error handling
export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
    const client = await pool.connect();
    try {
        const result = await client.query(text, params);
        return result.rows as T[];
    } finally {
        client.release();
    }
}

// Event types matching database schema
export interface DbEvent {
    id: string;
    source_id: string | null;
    source_hash: string;
    title: string;
    alert: string | null;
    summary: string[];
    raw_content: string | null;
    category: "War" | "Market" | "Disaster" | "Tech" | "Policy" | "Crypto" | "Energy" | "Other";
    severity: number;
    confidence: number;
    market_impact: "none" | "low" | "medium" | "high";
    entities: string[];
    geo: { lat: number; lon: number } | null;
    source_url: string | null;
    published_at: Date;
    ingested_at: Date;
    promoted_at: Date | null;
    created_at: Date;
}

// Get events with filtering
export async function getEvents(options: {
    category?: string;
    minSeverity?: number;
    limit?: number;
    offset?: number;
} = {}): Promise<DbEvent[]> {
    const { category, minSeverity = 40, limit = 50, offset = 0 } = options;

    let whereClause = "WHERE severity >= $1 AND confidence >= 0.5";
    const params: unknown[] = [minSeverity];
    let paramIndex = 2;

    if (category && category !== "All") {
        whereClause += ` AND category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
    }

    params.push(limit, offset);

    const sql = `
    SELECT 
      id, source_id, source_hash, title, alert, summary, 
      category, severity, confidence, market_impact, 
      entities, geo, source_url, published_at, ingested_at, 
      promoted_at, created_at
    FROM events
    ${whereClause}
    ORDER BY severity DESC, published_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

    return query<DbEvent>(sql, params);
}

// Get single event by ID
export async function getEventById(id: string): Promise<DbEvent | null> {
    const events = await query<DbEvent>(
        "SELECT * FROM events WHERE id = $1",
        [id]
    );
    return events[0] || null;
}

// Get event count for pagination
export async function getEventCount(options: {
    category?: string;
    minSeverity?: number;
} = {}): Promise<number> {
    const { category, minSeverity = 40 } = options;

    let whereClause = "WHERE severity >= $1 AND confidence >= 0.5";
    const params: unknown[] = [minSeverity];

    if (category && category !== "All") {
        whereClause += " AND category = $2";
        params.push(category);
    }

    const result = await query<{ count: string }>(
        `SELECT COUNT(*) FROM events ${whereClause}`,
        params
    );

    return parseInt(result[0]?.count || "0", 10);
}
