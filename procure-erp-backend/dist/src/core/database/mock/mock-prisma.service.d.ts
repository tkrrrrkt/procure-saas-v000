export declare class MockPrismaService {
    private mockData;
    constructor();
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    findUnique(args: any): Promise<any>;
    findFirst(args: any): Promise<{
        emp_account_id: string;
        emp_account_cd: string;
        password_hash: string;
        role: string;
        created_at: Date;
        updated_at: Date;
    }>;
    findMany(args: any): Promise<any>;
    create(args: any): Promise<any>;
    update(args: any): Promise<any>;
    delete(args: any): Promise<any>;
    get empAccount(): {
        findFirst: (args: any) => Promise<{
            emp_account_id: string;
            emp_account_cd: string;
            password_hash: string;
            role: string;
            created_at: Date;
            updated_at: Date;
        }>;
        findUnique: (args: any) => Promise<any>;
        findMany: (args: any) => Promise<any>;
        create: (args: any) => Promise<any>;
        update: (args: any) => Promise<any>;
        delete: (args: any) => Promise<any>;
    };
}
