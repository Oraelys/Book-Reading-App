export interface Notification {

    recipientId:string;

    senderId?:string;

    title:string;

    message:string;

    type:string;

    referenceId?:string;

    referenceType?:string;

    metadata?:Record<string, any>;

}