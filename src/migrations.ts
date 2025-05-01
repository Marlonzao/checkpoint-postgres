import { getTablesWithSchema } from "./sql.js";

/**
 * To add a new migration, add a new string to the list returned by the getMigrations function.
 * The position of the migration in the list is the version number.
 */
export const getMigrations = (schema: string) => {
	const SCHEMA_TABLES = getTablesWithSchema(schema);
	return [
		// Versão 0: Migrations tracking
		`CREATE TABLE IF NOT EXISTS ${SCHEMA_TABLES.checkpoint_migrations} (
      v INTEGER PRIMARY KEY
    );`,

		// Versão 1: Nova tabela threads com TTL
		`CREATE TABLE IF NOT EXISTS ${SCHEMA_TABLES.threads} (
      thread_id TEXT PRIMARY KEY,
      valid_till TIMESTAMPTZ NOT NULL
    );`,

		// Versão 2: Tabela checkpoints com FK
		`CREATE TABLE IF NOT EXISTS ${SCHEMA_TABLES.checkpoints} (
      thread_id TEXT NOT NULL,
      checkpoint_ns TEXT NOT NULL DEFAULT '',
      checkpoint_id TEXT NOT NULL,
      parent_checkpoint_id TEXT,
      type TEXT,
      checkpoint JSONB NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}',
      PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id),
      FOREIGN KEY (thread_id) REFERENCES ${SCHEMA_TABLES.threads}(thread_id) ON DELETE CASCADE
    );`,

		// Versão 3: Tabela checkpoint_blobs com FK
		`CREATE TABLE IF NOT EXISTS ${SCHEMA_TABLES.checkpoint_blobs} (
      thread_id TEXT NOT NULL,
      checkpoint_ns TEXT NOT NULL DEFAULT '',
      channel TEXT NOT NULL,
      version TEXT NOT NULL,
      type TEXT NOT NULL,
      blob BYTEA,
      PRIMARY KEY (thread_id, checkpoint_ns, channel, version),
      FOREIGN KEY (thread_id) REFERENCES ${SCHEMA_TABLES.threads}(thread_id) ON DELETE CASCADE
    );`,

		// Versão 4: Tabela checkpoint_writes com FK
		`CREATE TABLE IF NOT EXISTS ${SCHEMA_TABLES.checkpoint_writes} (
      thread_id TEXT NOT NULL,
      checkpoint_ns TEXT NOT NULL DEFAULT '',
      checkpoint_id TEXT NOT NULL,
      task_id TEXT NOT NULL,
      idx INTEGER NOT NULL,
      channel TEXT NOT NULL,
      type TEXT,
      blob BYTEA NOT NULL,
      PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id, task_id, idx),
      FOREIGN KEY (thread_id) REFERENCES ${SCHEMA_TABLES.threads}(thread_id) ON DELETE CASCADE
    );`,

		// Versão 5: Permitir blob nulo
		`ALTER TABLE ${SCHEMA_TABLES.checkpoint_blobs} ALTER COLUMN blob DROP NOT NULL;`,

		// Versão 6: Índice na coluna valid_till da tabela threads
		`CREATE INDEX IF NOT EXISTS idx_threads_valid_till ON ${SCHEMA_TABLES.threads}(valid_till);`,
	];
};