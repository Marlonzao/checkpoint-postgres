var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
/* eslint-disable no-process-env */
import { describe, it, expect, beforeEach, afterAll } from "@jest/globals";
import { uuid6, } from "@langchain/langgraph-checkpoint";
import pg from "pg";
import { PostgresSaver } from "../index.js"; // Adjust the import path as needed
const { Pool } = pg;
const checkpoint1 = {
    v: 1,
    id: uuid6(-1),
    ts: "2024-04-19T17:19:07.952Z",
    channel_values: {
        someKey1: "someValue1",
    },
    channel_versions: {
        someKey1: 1,
        someKey2: 1,
    },
    versions_seen: {
        someKey3: {
            someKey4: 1,
        },
    },
    pending_sends: [],
};
const checkpoint2 = {
    v: 1,
    id: uuid6(1),
    ts: "2024-04-20T17:19:07.952Z",
    channel_values: {
        someKey1: "someValue2",
    },
    channel_versions: {
        someKey1: 1,
        someKey2: 2,
    },
    versions_seen: {
        someKey3: {
            someKey4: 2,
        },
    },
    pending_sends: [],
};
const { TEST_POSTGRES_URL } = process.env;
if (!TEST_POSTGRES_URL) {
    throw new Error("TEST_POSTGRES_URL environment variable is required");
}
let postgresSavers = [];
describe.each([
    { schema: undefined, description: "the default schema" },
    { schema: "custom_schema", description: "a custom schema" },
])("PostgresSaver with $description", ({ schema }) => {
    let postgresSaver;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        const pool = new Pool({
            connectionString: TEST_POSTGRES_URL,
        });
        // Generate a unique database name
        const dbName = `lg_test_db_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        try {
            // Create a new database
            yield pool.query(`CREATE DATABASE ${dbName}`);
            console.log(`Created database: ${dbName}`);
            // Connect to the new database
            const dbConnectionString = `${TEST_POSTGRES_URL === null || TEST_POSTGRES_URL === void 0 ? void 0 : TEST_POSTGRES_URL.split("/").slice(0, -1).join("/")}/${dbName}`;
            postgresSaver = PostgresSaver.fromConnString(dbConnectionString, {
                schema,
            });
            postgresSavers.push(postgresSaver);
            yield postgresSaver.setup();
        }
        finally {
            yield pool.end();
        }
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield Promise.all(postgresSavers.map((saver) => saver.end()));
        // clear the ended savers to clean up for the next test
        postgresSavers = [];
        // Drop all test databases
        const pool = new Pool({
            connectionString: TEST_POSTGRES_URL,
        });
        try {
            const result = yield pool.query(`
      SELECT datname FROM pg_database
      WHERE datname LIKE 'lg_test_db_%'
    `);
            for (const row of result.rows) {
                const dbName = row.datname;
                yield pool.query(`DROP DATABASE ${dbName}`);
                console.log(`Dropped database: ${dbName}`);
            }
        }
        finally {
            yield pool.end();
        }
    }));
    it("should save and retrieve checkpoints correctly", () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        // get undefined checkpoint
        const undefinedCheckpoint = yield postgresSaver.getTuple({
            configurable: { thread_id: "1" },
        });
        expect(undefinedCheckpoint).toBeUndefined();
        // save first checkpoint
        const runnableConfig = yield postgresSaver.put({ configurable: { thread_id: "1" } }, checkpoint1, { source: "update", step: -1, writes: null, parents: {} }, checkpoint1.channel_versions);
        expect(runnableConfig).toEqual({
            configurable: {
                thread_id: "1",
                checkpoint_ns: "",
                checkpoint_id: checkpoint1.id,
            },
        });
        // add some writes
        yield postgresSaver.putWrites({
            configurable: {
                checkpoint_id: checkpoint1.id,
                checkpoint_ns: "",
                thread_id: "1",
            },
        }, [["bar", "baz"]], "foo");
        // get first checkpoint tuple
        const firstCheckpointTuple = yield postgresSaver.getTuple({
            configurable: { thread_id: "1" },
        });
        expect(firstCheckpointTuple === null || firstCheckpointTuple === void 0 ? void 0 : firstCheckpointTuple.config).toEqual({
            configurable: {
                thread_id: "1",
                checkpoint_ns: "",
                checkpoint_id: checkpoint1.id,
            },
        });
        expect(firstCheckpointTuple === null || firstCheckpointTuple === void 0 ? void 0 : firstCheckpointTuple.checkpoint).toEqual(checkpoint1);
        expect(firstCheckpointTuple === null || firstCheckpointTuple === void 0 ? void 0 : firstCheckpointTuple.metadata).toEqual({
            source: "update",
            step: -1,
            writes: null,
            parents: {},
        });
        expect(firstCheckpointTuple === null || firstCheckpointTuple === void 0 ? void 0 : firstCheckpointTuple.parentConfig).toBeUndefined();
        expect(firstCheckpointTuple === null || firstCheckpointTuple === void 0 ? void 0 : firstCheckpointTuple.pendingWrites).toEqual([
            ["foo", "bar", "baz"],
        ]);
        // save second checkpoint
        yield postgresSaver.put({
            configurable: {
                thread_id: "1",
                checkpoint_id: "2024-04-18T17:19:07.952Z",
            },
        }, checkpoint2, { source: "update", step: -1, writes: null, parents: {} }, checkpoint2.channel_versions);
        // verify that parentTs is set and retrieved correctly for second checkpoint
        const secondCheckpointTuple = yield postgresSaver.getTuple({
            configurable: { thread_id: "1" },
        });
        expect(secondCheckpointTuple === null || secondCheckpointTuple === void 0 ? void 0 : secondCheckpointTuple.metadata).toEqual({
            source: "update",
            step: -1,
            writes: null,
            parents: {},
        });
        expect(secondCheckpointTuple === null || secondCheckpointTuple === void 0 ? void 0 : secondCheckpointTuple.parentConfig).toEqual({
            configurable: {
                thread_id: "1",
                checkpoint_ns: "",
                checkpoint_id: "2024-04-18T17:19:07.952Z",
            },
        });
        // list checkpoints
        const checkpointTupleGenerator = postgresSaver.list({
            configurable: { thread_id: "1" },
        });
        const checkpointTuples = [];
        try {
            for (var _d = true, checkpointTupleGenerator_1 = __asyncValues(checkpointTupleGenerator), checkpointTupleGenerator_1_1; checkpointTupleGenerator_1_1 = yield checkpointTupleGenerator_1.next(), _a = checkpointTupleGenerator_1_1.done, !_a; _d = true) {
                _c = checkpointTupleGenerator_1_1.value;
                _d = false;
                const checkpoint = _c;
                checkpointTuples.push(checkpoint);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = checkpointTupleGenerator_1.return)) yield _b.call(checkpointTupleGenerator_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        expect(checkpointTuples.length).toBe(2);
        const checkpointTuple1 = checkpointTuples[0];
        const checkpointTuple2 = checkpointTuples[1];
        expect(checkpointTuple1.checkpoint.ts).toBe("2024-04-20T17:19:07.952Z");
        expect(checkpointTuple2.checkpoint.ts).toBe("2024-04-19T17:19:07.952Z");
    }));
});
