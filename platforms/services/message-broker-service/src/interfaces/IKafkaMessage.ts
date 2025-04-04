export interface IKafkaMessage<T = any>
{
    key?: string;
    value: T;
    headers?: Record<string, string>;
}