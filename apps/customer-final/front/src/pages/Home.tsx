import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { localMiddlewareInstance } from 'customer-final-middleware';

export const Home: React.FC = () => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['users'],
        queryFn: () => localMiddlewareInstance.getUsers(),
    });

    if (isLoading) return <div>Loading users...</div>;
    if (error) return <div>Error: {(error as Error).message}</div>;

    const users = data?.data || [];

    return (
        <div>
            <h1 className="text-amber-300">Users List</h1>
            <ul>
                {Array.isArray(users) && users.length > 0 ? (
                    users.map((user: any) => (
                        <li key={user.id}>
                            {user.name} ({user.email})
                        </li>
                    ))
                ) : (
                    <li>No users found.</li>
                )}
            </ul>
        </div>
    );
};

export default Home;
