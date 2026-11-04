import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const itemLibraryQuery = queryOptions({
  queryKey: ["item-library"],
  queryFn: async () => {
    const { data, error } = await supabase.from("item_library").select("*").order("name");
    if (error) throw error;
    return data;
  },
});