// apps/customer-app/local-middleware/src/api/OrderRepository.ts

import { IApiRepository } from "./IApiRepository";
import { ApiProxy } from "../../../proxy/src/ApiProxy";

export interface Order {
  id: string;
  userId: string;
  items: any[];
  total: number;
  status: string;
  // Add additional fields as needed.
}

export class OrderRepository implements IApiRepository<Order> {
  private apiProxy: ApiProxy;
  private endpoint: string = "/orders";

  constructor() {
    this.apiProxy = new ApiProxy();
  }

  public async fetchAll(): Promise<Order[]> {
    const response = await this.apiProxy.get(this.endpoint);
    return response.data;
  }

  public async fetchById(id: string): Promise<Order> {
    const response = await this.apiProxy.get(`${this.endpoint}/${id}`);
    return response.data;
  }

  public async create(data: Order): Promise<Order> {
    const response = await this.apiProxy.post(this.endpoint, data);
    return response.data;
  }

  public async update(id: string, data: Partial<Order>): Promise<Order> {
    const response = await this.apiProxy.put(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  public async delete(id: string): Promise<void> {
    await this.apiProxy.delete(`${this.endpoint}/${id}`);
  }
}
