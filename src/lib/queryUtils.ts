import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryKey,
  UseQueryOptions,
  UseMutationOptions,
  MutationFunction,
} from '@tanstack/react-query';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from './supabase';
import React from 'react';

export function useSupabaseQuery<TQueryFnData = unknown, TError = Error, TData = TQueryFnData>(
  key: QueryKey,
  fetcher: () => Promise<TQueryFnData>,
  options: Omit<UseQueryOptions<TQueryFnData, TError, TData, QueryKey>, 'queryKey' | 'queryFn'> = {},
) {
  return useQuery({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: fetcher,
    ...options,
  });
}

export function useSupabaseMutation<TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
  key: QueryKey | string,
  mutationFn: MutationFunction<TData, TVariables>,
  options: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'> = {},
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data: TData, variables: TVariables, context: TContext | undefined) => {
      if (Array.isArray(key)) {
        queryClient.invalidateQueries({ queryKey: key });
      } else {
        queryClient.invalidateQueries({ queryKey: [key] });
      }

      if (options?.onSuccess) {
        if (context !== undefined) {
          options.onSuccess(data, variables, context);
        }
      }
    },
    ...options,
  });
}

export function useSupabaseSubscription<T extends Record<string, unknown> = Record<string, unknown>>(
  tableName: string,
  onDataChange: (payload: RealtimePostgresChangesPayload<T>) => void,
) {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const subscription = supabase
      .channel(`public:${tableName}`)
      .on('postgres_changes',
          { event: '*', schema: 'public', table: tableName },
          (payload: RealtimePostgresChangesPayload<T>) => {
            if (onDataChange) {
              onDataChange(payload);
            }

            queryClient.invalidateQueries({ queryKey: [tableName] });
          })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [tableName, onDataChange, queryClient]);
}