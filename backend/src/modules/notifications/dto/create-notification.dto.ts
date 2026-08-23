export class CreateNotificationDto {

    recipientId!:string;

    senderId?:string;

    type!:string;

    title!:string;

    message!:string;

    referenceId?:string;

    referenceType?:string;

    metadata?:Record<string, any>;

}