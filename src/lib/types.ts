import { Timestamp } from "firebase/firestore";

export interface Answer {
    id: string;
    label?: string;
    imageUrl?: string;
}

export interface Question {
    id: string;
    text: string;
    answers: Answer[];
}

export interface Form {
    id: string;
    title: string;
    status: "active" | "archived" | "draft";
    questions: Question[];
    createdAt: Timestamp;
}

export interface Response {
    id?: string;
    formId: string;
    answers: {
        questionId: string;
        answerId: string;
    }[];
    timestamp: Timestamp;
}
