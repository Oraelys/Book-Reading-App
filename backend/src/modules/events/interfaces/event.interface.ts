export interface PlatformEvent {

    type:string;

    userId?:string;

    recipientId?:string;

    novelId?:string;

    chapterId?:string;

    commentId?:string;

    seriesId?:string;

    metadata?:Record<string, any>;

}