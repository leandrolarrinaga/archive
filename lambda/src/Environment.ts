class Environment {
    readonly BACKUP_BUCKET: string;

    private constructor() {
        if (!process.env.BACKUP_BUCKET) {
            throw new Error("Lambda Environment is not configured");
        }

        this.BACKUP_BUCKET = process.env.BACKUP_BUCKET;
    }

    private static _instance: Environment;

    public static get instance(): Environment {
        if (!Environment._instance)
            Environment._instance = new Environment();

        return Environment._instance;
    }
}

export default Environment.instance;