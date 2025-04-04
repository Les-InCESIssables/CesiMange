
export interface IConsumerConfig {
    groupId: string;
    autoCommit?: boolean;
    sessionTimeout?: number;
}
