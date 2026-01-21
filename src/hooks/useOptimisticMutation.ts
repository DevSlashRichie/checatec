import { useMutation, useQueryClient, MutationKey, UseMutationOptions } from '@tanstack/react-query'

interface OptimisticMutationOptions<TData, TError, TVariables, TContext>
    extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'onMutate' | 'onError' | 'onSettled'> {
    queryKey: unknown[];
    updater: (oldData: any, variables: TVariables) => any;
    invalidateOnSettled?: boolean;
}

export function useOptimisticMutation<TData, TError, TVariables, TContext = unknown>(
    options: OptimisticMutationOptions<TData, TError, TVariables, { previousData: unknown }>
) {
    const queryClient = useQueryClient()
    const { queryKey, updater, invalidateOnSettled = true, ...mutationOptions } = options

    return useMutation({
        ...mutationOptions,
        onMutate: async (variables) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey })

            // Snapshot the previous value
            const previousData = queryClient.getQueryData(queryKey)

            // Optimistically update to the new value
            if (previousData) {
                queryClient.setQueryData(queryKey, (old: any) => updater(old, variables))
            }

            // Return a context object with the snapshotted value
            return { previousData }
        },
        onError: (err, newTodo, context) => {
            // Follow up with user defined onError if exists
            if (mutationOptions.onError) {
                // @ts-ignore
                mutationOptions.onError(err, newTodo, context)
            }

            // Rollback using the context returned from onMutate
            if (context?.previousData) {
                queryClient.setQueryData(queryKey, context.previousData)
            }
        },
        onSettled: (data, error, variables, context) => {
            // Follow up with user defined onSettled if exists
            if (mutationOptions.onSettled) {
                mutationOptions.onSettled(data, error, variables, context)
            }

            // Always invalidate the query after error or success if flag is true
            if (invalidateOnSettled) {
                queryClient.invalidateQueries({ queryKey })
            }
        },
    })
}
