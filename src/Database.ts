import { MongoClient, Db } from 'mongodb';

const BASE_URL = 'mongodb://localhost:27017/highlights';

/**
 * Singleton that manages a connection to a MongoDB database
 */
export class Database {
    private static instance: Database;

    /** Mongo Db reference */
    private __db: Db | null = null;
    private __url: string | null = null;
    private __mode: Mode | null = null;

    private constructor() {}

    /** Gets the singleton instance */
    static get() {
        if (!Database.instance) {
            Database.instance = new Database();
        }

        return Database.instance;
    }

    /**
     * Connects to a database. The given mode determines the database's name.
     * When mode is Mode.TEST, this function will attempt to connect to a
     * database named 'highlights_test'. There is similar functionality for
     * every value in the Mode enum.
     */
    async connect(mode) {
        if (this.__mode !== null && mode !== this.__mode) {
            throw new Error('already connected with mode ' + Mode[mode]);
        }
        if (this.__db !== null) {
            return;
        }

        this.__mode = mode;
        this.__url = BASE_URL + '_' + Mode[mode].toLowerCase();
        this.__db = await MongoClient.connect(this.__url);
    }

    /** Disconnects from the database if connected */
    async disconnect() {
        // Nothing to be done
        if (this.__db === null) return;

        await this.__db.close();
        this.__db = null;
        this.__url = null;
        this.__mode = null;
    }

    /** Gets the mongodb.Db instance */
    mongo(): Db {
        if (this.__db === null) throw new Error('not connected');
        return this.__db;
    }

    /** Gets the connection URI (mongodb://<whatever>) */
    url(): string {
        if (this.__url === null) throw new Error('not connected');
        return this.__url;
    }

    mode(): Mode {
        if (this.__mode === null) throw new Error('not connected');
        return this.__mode;
    }

    isConnected(): boolean {
        return this.__db !== null;
    }

    _mongo(): Db | null {
        return this.__db;
    }

    _url(): string | null {
        return this.__url;
    }

    _mode(): Mode | null {
        return this.__mode;
    }

    /**
     * Drops a collection from the database if it already exists. Resolves to
     * true if the collection doesn't exist or if the collection was dropped
     * successfully. Resolves to false if dropping was unsuccessful.
     *
     * @param name Collection name
     */
    async dropIfExists(name: string): Promise<boolean> {
        if (!this.isConnected()) throw new Error('not connected');

        // Find collections with the specified name
        const colls = await this.__db!.listCollections({name: name}).toArray();
        // Drop if Mongo reports that a collection with that name exists,
        // otherwise return true
        return colls.length > 0 ? await this.__db!.dropCollection(colls[0].name) : true;
    }
}

/** Database connection mode */
export enum Mode {
    PROD,
    TEST
}
