import { APIGatewayEvent, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import AWS from "aws-sdk";
import Environment from "./Environment";

const s3 = new AWS.S3();

export async function handler(event: APIGatewayEvent): Promise<APIGatewayProxyStructuredResultV2> {
    let response: APIGatewayProxyStructuredResultV2 = {
        statusCode: 500,
        body: "Something has gone wrong"
    }

    try {
        if (!event.body)
            throw new Error("Incorrect Params");

        const body = JSON.parse(event.body);

        if (!body.bucket)
            throw new Error("Missing Bucket");

        await backup(body.bucket);
        
        console.info(`${body.bucket} has been backed up in bucket ${Environment.BACKUP_BUCKET}`)
        response.statusCode = 200;
        response.body = "ok";

    } catch (error) {
        response.statusCode = 400;
        response.body = error.message;
    }

    return response;
}

async function backup(bucket: string) {
    const objects: AWS.S3.ListObjectsV2Output = await s3.listObjectsV2({ Bucket: bucket }).promise()
        .catch(err => {
            console.log(err.message);
            throw new Error("Unable to fetch object list from bucket")
        });

    if (!objects.Contents)
        return;

    const date = new Date().toISOString();
    let promises: Promise<AWS.S3.CopyObjectOutput>[] = [];

    for (const object of objects.Contents) {
        if (object.Key)
            promises.push(s3.copyObject({ Bucket: Environment.BACKUP_BUCKET, CopySource: `${bucket}/${object.Key}`, Key: `${bucket}/${date}/${object.Key}` }).promise());
    }

    await Promise.all(promises).catch(err => {
        console.error(err.message);

        throw new Error("Unable to Backup");
    });
}
