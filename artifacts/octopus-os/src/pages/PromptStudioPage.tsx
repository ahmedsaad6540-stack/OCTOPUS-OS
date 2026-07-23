import { useState, useRef } from "react";
import { useDirectives, useDirectiveMutations } from "@/hooks/useDirectives";
import { useCampaignMutations } from "@/hooks/useCampaigns";
import { Directive } from "@/domain/models/directive";
import { DirectiveSidebar } from "@/components/prompt-studio/DirectiveSidebar";
import { PromptEditor } from "@/components/prompt-studio/PromptEditor";
import { PromptPreview } from "@/components/prompt-studio/PromptPreview";
import { PromptTestPanel } from "@/components/prompt-studio/PromptTestPanel";
import { useUiStore } from "@/store/useUiStore";

export function PromptStudioPage() {
  const { data: directives = [], isLoading } = useDirectives();
  const { saveDirective, testAI } = useDirectiveMutations();
  const { createCampaign } = useCampaignMutations();
  
  const { selectedDirectiveId, setSelectedDirectiveId } = useUiStore();
  const [mode, setMode] = useState<"view" | "edit" | "new" | "test">("view");
  const [draft, setDraft] = useState<Partial<Directive>>({});
  
  const [testInput, setTestInput] = useState("");
  const [testOutput, setTestOutput] = useState("");
  const outputRef = useRef<HTMLPreElement>(null);

  const current = (selectedDirectiveId ? directives.find(d => d.id === selectedDirectiveId) : directives[0]) as Directive | undefined;

  const handleSelect = (id: string) => {
    setSelectedDirectiveId(id);
    setMode("view");
    setDraft({});
  };

  const startNew = () => {
    setDraft({
      name: "",
      category: "campaign",
      systemPrompt: "You are an expert affiliate marketer. Your goal is to create high-converting campaigns that generate real revenue through compelling storytelling and strategic content distribution.",
      userDirective: "",
      platforms: ["TikTok", "Instagram"],
      affiliateNetwork: "Digistore24",
      tone: "Energetic",
      language: "Arabic",
    });
    setMode("new");
  };

  const startEdit = () => {
    if (current) {
      setDraft({ ...current });
      setMode("edit");
    }
  };

  const handleSave = () => {
    if (!draft.name?.trim() || !draft.userDirective?.trim()) return;
    
    if (mode === "new") {
      const newDir: Directive = {
        id: `dir-${Date.now()}`,
        name: draft.name,
        category: draft.category as Directive["category"] ?? "campaign",
        systemPrompt: draft.systemPrompt ?? "",
        userDirective: draft.userDirective,
        platforms: draft.platforms ?? ["TikTok"],
        affiliateNetwork: draft.affiliateNetwork ?? "Digistore24",
        tone: draft.tone ?? "Energetic",
        language: draft.language ?? "Arabic",
        createdAt: new Date().toISOString(),
        campaignCount: 0,
      };
      saveDirective.mutate({ data: newDir }, {
        onSuccess: () => {
          setSelectedDirectiveId(newDir.id);
          setMode("view");
        }
      });
    } else if (current) {
      saveDirective.mutate({ data: draft as Directive }, {
        onSuccess: () => {
          setMode("view");
        }
      });
    }
  };

  const runTest = () => {
    if (!testInput.trim() || !current) return;
    setTestOutput("");
    testAI.mutate({
      prompt: testInput,
      agentName: current.name,
      systemPrompt: `${current.systemPrompt}\n\nUser Directive:\n${current.userDirective}\n\nPlatforms: ${current.platforms.join(", ")}\nTone: ${current.tone}\nLanguage: ${current.language}\nAffiliate Network: ${current.affiliateNetwork}`
    }, {
      onSuccess: (res) => setTestOutput(res),
      onError: (err: any) => setTestOutput(`❌ Error: ${err.message}`)
    });
  };

  const launchCampaign = () => {
    if (!current) return;
    createCampaign.mutate({
      name: current.name,
      platform: current.platforms[0] || "TikTok",
      affiliateNetwork: current.affiliateNetwork,
      productUrl: "",
    }, {
      onSuccess: () => {
        saveDirective.mutate({
          data: { ...current, campaignCount: current.campaignCount + 1, lastUsed: new Date().toISOString() }
        });
        alert(`✅ Campaign "${current.name}" created successfully!`);
      },
      onError: (err: any) => alert(`❌ Failed to launch campaign: ${err.message}`)
    });
  };

  const isEditing = mode === "edit" || mode === "new";

  if (isLoading) return <div className="p-6 text-white">Loading Directives...</div>;

  return (
    <div className="flex min-h-screen" style={{ background: "#06020f" }}>
      <DirectiveSidebar 
        directives={directives} 
        selectedId={selectedDirectiveId || (current?.id ?? null)} 
        onSelect={handleSelect} 
        onNew={startNew} 
        isEditing={isEditing} 
      />

      <div className="flex-1 overflow-y-auto">
        {isEditing ? (
          <PromptEditor 
            draft={draft} 
            setDraft={setDraft} 
            onSave={handleSave} 
            onCancel={() => { setMode("view"); setDraft({}); }} 
            isSaving={saveDirective.isPending} 
            mode={mode as "new" | "edit"} 
          />
        ) : current ? (
          <div className="p-6 space-y-6 max-w-3xl mx-auto">
            <PromptPreview 
              current={current} 
              onEdit={startEdit} 
              onTest={() => setMode("test")} 
              onLaunch={launchCampaign} 
              isLaunching={createCampaign.isPending} 
            />
            {mode === "test" && (
              <PromptTestPanel 
                testInput={testInput} 
                setTestInput={setTestInput} 
                runTest={runTest} 
                isTesting={testAI.isPending} 
                testOutput={testOutput} 
                outputRef={outputRef} 
              />
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
