import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServices } from "@/context/ServiceContext";
import { useAuth } from "@/context/AuthContext";
import { Directive } from "../domain/models/directive";

export function useDirectives() {
  const { directiveService } = useServices();

  return useQuery({
    queryKey: ["directives"],
    queryFn: () => directiveService.getDirectives(),
    staleTime: Infinity, // since it's local storage mostly for now
  });
}

export function useDirectiveMutations() {
  const { token } = useAuth();
  const { directiveService } = useServices();
  const queryClient = useQueryClient();

  const saveDirective = useMutation({
    mutationFn: async ({ data }: { data: Directive }) => {
      return directiveService.saveDirective(data);
    },
    onMutate: async ({ data }) => {
      await queryClient.cancelQueries({ queryKey: ["directives"] });
      const previous = queryClient.getQueryData<Directive[]>(["directives"]);
      queryClient.setQueryData<Directive[]>(["directives"], (old) => {
        if (!old) return [data];
        const index = old.findIndex(d => d.id === data.id);
        if (index === -1) return [data, ...old];
        const newArr = [...old];
        newArr[index] = data;
        return newArr;
      });
      return { previous };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(["directives"], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["directives"] });
    },
  });

  const testAI = useMutation({
    mutationFn: ({ prompt, agentName, systemPrompt }: { prompt: string; agentName: string; systemPrompt: string }) =>
      directiveService.testPrompt(token!, prompt, agentName, systemPrompt)
  });

  const optimizePrompt = useMutation({
    mutationFn: (directive: Directive) => directiveService.optimizePrompt(token!, directive),
    onSuccess: (updatedDirective) => {
      queryClient.setQueryData<Directive[]>(["directives"], (old) => {
        if (!old) return [updatedDirective];
        const index = old.findIndex(d => d.id === updatedDirective.id);
        if (index === -1) return [updatedDirective, ...old];
        const newArr = [...old];
        newArr[index] = updatedDirective;
        return newArr;
      });
    }
  });

  return {
    saveDirective,
    testAI,
    optimizePrompt,
  };
}
