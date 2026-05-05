import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useApi from "../useApi";
import {
    Member,
    MemberResponse,
    MembersResponse,
    Agent,
    AgentResponse,
    AgentsResponse,
    Interest,
    InterestResponse,
    InterestsResponse,
    Account,
    AccountResponse,
    AccountsResponse,
    AccountBooksResponse,
    AccountGroupsResponse,
    InterestsByGroupResponse,
    DashboardCountsResponse,
    RecentDataResponse,
    PreMaturityAccountsResponse,
    PostMaturityAccountsResponse,
    AccountsForAssignmentResponse,
} from "../../types";



// Re-export types for use in other modules
export type { Member, Agent, Interest, Account };

// GET ALL MEMBERS
export const useGetMembers = (
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string
) => {
    return useQuery({
        queryKey: ["members", page, limit, search, status],
        queryFn: async () => {
            const params: Record<string, any> = { page, limit };
            if (search) params.search = search;
            if (status) params.status = status;

            return await useApi<MembersResponse>("GET", "/admin/get-members", undefined, params);
        },

    });
};

// GET MEMBER BY ID
export const useGetMemberById = (memberId: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: ["member", memberId],
        queryFn: async () => {
            return await useApi<MemberResponse>("GET", `/admin/get-member/${memberId}`);
        },
        enabled: enabled && !!memberId, // Only run query if enabled and memberId exists

    });
};

// CREATE MEMBER
export const useCreateMember = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (memberData: Partial<Member>) => {
            return await useApi<MemberResponse>("POST", "/admin/create-member", memberData);
        },
        onSuccess: () => {
            // Invalidate and refetch members list
            queryClient.invalidateQueries({ queryKey: ["members"] });
        },
    });
};

// UPDATE MEMBER
export const useUpdateMember = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ memberId, data }: { memberId: string; data: Partial<Member> }) => {
            return await useApi<MemberResponse>("PUT", `/admin/update-member/${memberId}`, data);
        },
        onSuccess: (_, variables) => {
            // Invalidate and refetch members list and specific member
            queryClient.invalidateQueries({ queryKey: ["members"] });
            queryClient.invalidateQueries({ queryKey: ["member", variables.memberId] });
        },
    });
};

// ==================== AGENT QUERIES ====================

// GET ALL AGENTS
export const useGetAgents = (
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string
) => {
    return useQuery({
        queryKey: ["agents", page, limit, search, status],
        queryFn: async () => {
            const params: Record<string, any> = { page, limit };
            if (search) params.search = search;
            if (status) params.status = status;

            return await useApi<AgentsResponse>("GET", "/admin/get-agents", undefined, params);
        },

    });
};

// GET AGENT BY ID
export const useGetAgentById = (agentId: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: ["agent", agentId],
        queryFn: async () => {
            return await useApi<AgentResponse>("GET", `/admin/get-agent/${agentId}`);
        },
        enabled: enabled && !!agentId, // Only run query if enabled and agentId exists

    });
};

// CREATE AGENT
export const useCreateAgent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (agentData: Partial<Agent>) => {
            return await useApi<AgentResponse>("POST", "/admin/create-agent", agentData);
        },
        onSuccess: () => {
            // Invalidate and refetch agents list
            queryClient.invalidateQueries({ queryKey: ["agents"] });
        },
    });
};

// UPDATE AGENT
export const useUpdateAgent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ agentId, data }: { agentId: string; data: Partial<Agent> }) => {
            return await useApi<AgentResponse>("PUT", `/admin/update-agent/${agentId}`, data);
        },
        onSuccess: (_, variables) => {
            // Invalidate and refetch agents list and specific agent
            queryClient.invalidateQueries({ queryKey: ["agents"] });
            queryClient.invalidateQueries({ queryKey: ["agent", variables.agentId] });
        },
    });
};

// GET ALL AGENTS (for dropdowns - no pagination)
export const useGetAllAgents = (enabled: boolean = true) => {
    return useQuery({
        queryKey: ["allAgents"],
        queryFn: async () => {
            // Fetch with high limit to get all active agents
            const params = { page: 1, limit: 1000, status: "active" };
            return await useApi<AgentsResponse>("GET", "/admin/get-agents", undefined, params);
        },
        staleTime: 1000 * 60 * 10, // 10 minutes cache
        enabled,
    });
};

// ==================== INTEREST QUERIES ====================

// GET ALL INTERESTS
export const useGetInterests = (
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string
) => {
    return useQuery({
        queryKey: ["interests", page, limit, search, status],
        queryFn: async () => {
            const params: Record<string, any> = { page, limit };
            if (search) params.search = search;
            if (status) params.status = status;

            return await useApi<InterestsResponse>("GET", "/admin/get-interests", undefined, params);
        },

    });
};

// GET INTEREST BY ID
export const useGetInterestById = (interestId: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: ["interest", interestId],
        queryFn: async () => {
            return await useApi<InterestResponse>("GET", `/admin/get-interest/${interestId}`);
        },
        enabled: enabled && !!interestId, // Only run query if enabled and interestId exists

    });
};

// CREATE INTEREST
export const useCreateInterest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (interestData: Partial<Interest>) => {
            return await useApi<InterestResponse>("POST", "/admin/create-interest", interestData);
        },
        onSuccess: () => {
            // Invalidate and refetch interests list
            queryClient.invalidateQueries({ queryKey: ["interests"] });
        },
    });
};

// UPDATE INTEREST
export const useUpdateInterest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ interestId, data }: { interestId: string; data: Partial<Interest> }) => {
            return await useApi<InterestResponse>("PUT", `/admin/update-interest/${interestId}`, data);
        },
        onSuccess: (_, variables) => {
            // Invalidate and refetch interests list and specific interest
            queryClient.invalidateQueries({ queryKey: ["interests"] });
            queryClient.invalidateQueries({ queryKey: ["interest", variables.interestId] });
        },
    });
};

// ==================== ACCOUNT QUERIES ====================

// GET ALL ACCOUNT BOOKS
export const useGetAccountBooks = () => {
    return useQuery({
        queryKey: ["accountBooks"],
        queryFn: async () => {
            return await useApi<AccountBooksResponse>("GET", "/admin/get-account-books");
        },
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
};

// GET ALL ACCOUNT GROUPS
export const useGetAccountGroups = (account_book_id?: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: ["accountGroups", account_book_id],
        queryFn: async () => {
            const params: Record<string, any> = {};
            if (account_book_id) params.account_book_id = account_book_id;

            return await useApi<AccountGroupsResponse>("GET", "/admin/get-account-groups", undefined, params);
        },
        staleTime: 1000 * 60 * 10, // 10 minutes
        enabled,
    });
};

// GET INTERESTS BY ACCOUNT GROUP
export const useGetInterestsByAccountGroup = (account_group_id: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: ["interestsByGroup", account_group_id],
        queryFn: async () => {
            return await useApi<InterestsByGroupResponse>("GET", `/admin/get-interests-by-account-group/${account_group_id}`);
        },
        enabled: enabled && !!account_group_id,

    });
};

// CREATE ACCOUNT
export const useCreateAccount = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (accountData: Partial<Account>) => {
            return await useApi<AccountResponse>("POST", "/admin/create-account", accountData);
        },
        onSuccess: () => {
            // Invalidate and refetch accounts list
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
        },
    });
};

// GET ALL ACCOUNTS
export const useGetAccounts = (
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string,
    account_type?: string
) => {
    return useQuery({
        queryKey: ["accounts", page, limit, search, status, account_type],
        queryFn: async () => {
            const params: Record<string, any> = { page, limit };
            if (search) params.search = search;
            if (status) params.status = status;
            if (account_type) params.account_type = account_type;

            return await useApi<AccountsResponse>("GET", "/admin/get-accounts", undefined, params);
        },

    });
};

// GET ACCOUNT BY ID
export const useGetAccountById = (accountId: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: ["account", accountId],
        queryFn: async () => {
            return await useApi<AccountResponse>("GET", `/admin/get-account/${accountId}`);
        },
        enabled: enabled && !!accountId,

    });
};

// UPDATE ACCOUNT
export const useUpdateAccount = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ accountId, data }: { accountId: string; data: Partial<Account> }) => {
            return await useApi<AccountResponse>("PUT", `/admin/update-account/${accountId}`, data);
        },
        onSuccess: (_, variables) => {
            // Invalidate and refetch accounts list and specific account
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
            queryClient.invalidateQueries({ queryKey: ["account", variables.accountId] });
        },
    });
};

// ==================== DASHBOARD QUERIES ====================

// GET DASHBOARD COUNTS
export const useGetDashboardCounts = () => {
    return useQuery({
        queryKey: ["dashboardCounts"],
        queryFn: async () => {
            return await useApi<DashboardCountsResponse>("GET", "/admin/get-dashboard-counts");
        },
        refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    });
};

// GET RECENT ACCOUNTS AND MEMBERS
export const useGetRecentData = () => {
    return useQuery({
        queryKey: ["recentData"],
        queryFn: async () => {
            return await useApi<RecentDataResponse>("GET", "/admin/get-recent-data");
        },
        refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    });
};

// ==================== AGENT ACCOUNT CREATION ====================

// CREATE ACCOUNT BY AGENT
export const useCreateAccountByAgent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (accountData: Partial<Account>) => {
            return await useApi<AccountResponse>("POST", "/agent/create-account", accountData);
        },
        onSuccess: () => {
            // Invalidate and refetch accounts list
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
        },
    });
};

// ==================== MATURITY ACCOUNTS ====================

// GET PRE-MATURITY ACCOUNTS
export const useGetPreMaturityAccounts = (
    page: number = 1,
    limit: number = 25,
    account_type?: string,
    date_of_maturity?: string
) => {
    return useQuery({
        queryKey: ["preMaturityAccounts", page, limit, account_type, date_of_maturity],
        queryFn: async () => {
            const params: Record<string, any> = { page, limit };
            if (account_type) params.account_type = account_type;
            if (date_of_maturity) params.date_of_maturity = date_of_maturity;

            return await useApi<PreMaturityAccountsResponse>("GET", "/admin/get-pre-maturity-accounts", undefined, params);
        },
    });
};

// GET POST-MATURITY ACCOUNTS
export const useGetPostMaturityAccounts = (
    page: number = 1,
    limit: number = 25,
    account_type?: string,
    date_of_maturity?: string
) => {
    return useQuery({
        queryKey: ["postMaturityAccounts", page, limit, account_type, date_of_maturity],
        queryFn: async () => {
            const params: Record<string, any> = { page, limit };
            if (account_type) params.account_type = account_type;
            if (date_of_maturity) params.date_of_maturity = date_of_maturity;

            return await useApi<PostMaturityAccountsResponse>("GET", "/admin/get-post-maturity-accounts", undefined, params);
        },
    });
};

// PROCESS MATURITY PAYMENT AND CLOSE ACCOUNT
export interface MaturityPaymentData {
    principalAmount: number;
    interestAmount: number;
    totalPayout: number;
    paymentMode?: string;
    paymentReference?: string;
}

export const useProcessMaturityPayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ accountId, paymentData }: { accountId: string; paymentData: MaturityPaymentData }) => {
            return await useApi<AccountResponse>("PUT", `/admin/update-account/${accountId}`, {
                status: "Closed",
                date_of_close: new Date().toISOString(),
                account_amount: 0,
                payout_amount: paymentData.totalPayout,
                interest_paid: paymentData.interestAmount,
                payment_mode: paymentData.paymentMode,
                payment_reference: paymentData.paymentReference
            });
        },
        onSuccess: () => {
            // Invalidate all related queries
            queryClient.invalidateQueries({ queryKey: ["preMaturityAccounts"] });
            queryClient.invalidateQueries({ queryKey: ["postMaturityAccounts"] });
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
        },
    });
};

// CLOSE ACCOUNT WITHOUT PAYMENT (balance already 0)
export const useCloseAccount = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (accountId: string) => {
            return await useApi<AccountResponse>("PUT", `/admin/update-account/${accountId}`, {
                status: "Closed",
                date_of_close: new Date().toISOString()
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["preMaturityAccounts"] });
            queryClient.invalidateQueries({ queryKey: ["postMaturityAccounts"] });
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
        },
    });
};

// ==================== AGENT ASSIGNMENT ====================

// GET ACCOUNTS FOR ASSIGNMENT
export const useGetAccountsForAssignment = (
    page: number = 1,
    limit: number = 10,
    account_type?: string,
    account_no?: string
) => {
    return useQuery({
        queryKey: ["accountsForAssignment", page, limit, account_type, account_no],
        queryFn: async () => {
            const params: Record<string, any> = { page, limit };
            if (account_type) params.account_type = account_type;
            if (account_no) params.account_no = account_no;

            return await useApi<AccountsForAssignmentResponse>("GET", "/admin/get-accounts-for-assignment", undefined, params);
        },
    });
};

// UPDATE ACCOUNT ASSIGNMENT
export const useUpdateAccountAssignment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ accountId, assigned_to }: { accountId: string; assigned_to: string | null }) => {
            return await useApi<AccountResponse>("PUT", `/admin/update-account-assignment/${accountId}`, { assigned_to });
        },
        onSuccess: () => {
            // Invalidate and refetch accounts for assignment list
            queryClient.invalidateQueries({ queryKey: ["accountsForAssignment"] });
        },
    });
};

// CREATE MATURITY PAYMENT WITH CASHFREE
export const useCreateMaturityPaymentWithCashfree = () => {
    return useMutation({
        mutationFn: async (maturityPaymentData: any) => {
            return await useApi("POST", "/admin/maturity-payment", maturityPaymentData);
        },
    });
};
