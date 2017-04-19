import { Db, MongoClient } from 'mongodb';

const BASE_URL = 'mongodb://localhost:27017/novaxfer';

/**
 * Singleton that manages a connection to a MongoDB database
 */
export class Database {
    private static instance: Database;

    /** Mongo Db reference */
    private dbInt: Db | null = null;
    private urlInt: string | null = null;
    private modeInt: Mode | null = null;

    private constructor() {}

    /**
     * Connects to a database. The given mode determines the database's name.
     * When mode is Mode.TEST, this function will attempt to connect to a
     * database named 'highlights_test'. There is similar functionality for
     * every value in the Mode enum.
     */
    public async connect(mode) {
        if (this.modeInt !== null && mode !== this.modeInt) {
            throw new Error('already connected with mode ' + Mode[mode]);
        }
        if (this.dbInt !== null) {
            return;
        }

        this.modeInt = mode;
        this.urlInt = BASE_URL + '_' + Mode[mode].toLowerCase();
        this.dbInt = await MongoClient.connect(this.urlInt);
    }

    /** Disconnects from the database if connected */
    public async disconnect() {
        // Nothing to be done
        if (this.dbInt === null) return;

        await this.dbInt.close();
        this.dbInt = null;
        this.urlInt = null;
        this.modeInt = null;
    }

    /** Gets the mongodb.Db instance */
    public mongo(): Db {
        if (this.dbInt === null) throw new Error('not connected');
        return this.dbInt;
    }

    /** Gets the connection URI (mongodb://<whatever>) */
    public url(): string {
        if (this.urlInt === null) throw new Error('not connected');
        return this.urlInt;
    }

    public mode(): Mode {
        if (this.modeInt === null) throw new Error('not connected');
        return this.modeInt;
    }

    public isConnected(): boolean {
        return this.dbInt !== null;
    }

    public _mongo(): Db | null {
        return this.dbInt;
    }

    public _url(): string | null {
        return this.urlInt;
    }

    public _mode(): Mode | null {
        return this.modeInt;
    }

    /**
     * Drops a collection from the database if it already exists. Resolves to
     * true if the collection doesn't exist or if the collection was dropped
     * successfully. Resolves to false if dropping was unsuccessful.
     *
     * @param name Collection name
     */
    public async dropIfExists(name: string): Promise<boolean> {
        if (!this.isConnected()) throw new Error('not connected');

        // Find collections with the specified name
        const colls = await this.dbInt!.listCollections({name}).toArray();
        // Drop if Mongo reports that a collection with that name exists,
        // otherwise return true
        return colls.length > 0 ? await this.dbInt!.dropCollection(colls[0].name) : true;
    }

    /** Gets the singleton instance */
    public static get() {
        if (!Database.instance) {
            Database.instance = new Database();
        }

        return Database.instance;
    }
}

/** Database connection mode */
export enum Mode {
    PROD,
    TEST
}
