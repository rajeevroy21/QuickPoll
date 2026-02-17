import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getEffectiveFingerprint } from "@/lib/fingerprint";
import { Button } from "@/components/ui/button";
import { Check, Copy, Link as LinkIcon, Zap, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface PollOption {
  id: string;
  label: string;
  position: number;
}

interface VoteCounts {
  [optionId: string]: number;
}

const CHART_COLORS = [
  "bg-primary",
  "bg-accent",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
  "bg-primary",
  "bg-accent",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
];

const ViewPoll = () => {
  const { id } = useParams<{ id: string }>();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<PollOption[]>([]);
  const [voteCounts, setVoteCounts] = useState<VoteCounts>({});
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  const fingerprint = getEffectiveFingerprint();

  const fetchVotes = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from("votes")
      .select("option_id")
      .eq("poll_id", id);

    const counts: VoteCounts = {};
    data?.forEach((v) => {
      counts[v.option_id] = (counts[v.option_id] || 0) + 1;
    });
    setVoteCounts(counts);
  }, [id]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      const { data: poll } = await supabase
        .from("polls")
        .select("question")
        .eq("id", id)
        .single();

      if (!poll) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setQuestion(poll.question);

      const { data: opts } = await supabase
        .from("poll_options")
        .select("id, label, position")
        .eq("poll_id", id)
        .order("position");

      setOptions(opts || []);

      // Check if already voted
      const { data: existingVote } = await supabase
        .from("votes")
        .select("id")
        .eq("poll_id", id)
        .eq("voter_fingerprint", fingerprint)
        .maybeSingle();

      if (existingVote) setHasVoted(true);

      await fetchVotes();
      setLoading(false);
    };

    load();
  }, [id, fingerprint, fetchVotes]);

  // Real-time subscription
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`poll-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "votes",
          filter: `poll_id=eq.${id}`,
        },
        () => {
          fetchVotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, fetchVotes]);

  const handleVote = async () => {
    if (!selectedOption || !id) return;
    setVoting(true);

    try {
      const { error } = await supabase.from("votes").insert({
        poll_id: id,
        option_id: selectedOption,
        voter_fingerprint: fingerprint,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("You've already voted on this poll");
          setHasVoted(true);
        } else {
          throw error;
        }
      } else {
        setHasVoted(true);
        toast.success("Vote recorded!");
      }
    } catch (err) {
      toast.error("Failed to submit vote");
      console.error(err);
    } finally {
      setVoting(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading poll...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold font-display text-foreground mb-2">
            Poll not found
          </h1>
          <p className="text-muted-foreground mb-4">
            This poll doesn't exist or the link is invalid.
          </p>
          <Link to="/">
            <Button>Create a new poll</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Create your own
          </Link>
          <div className="inline-flex items-center gap-2 mb-2">
            <Zap className="w-6 h-6 text-primary" />
            <span className="font-display font-bold text-foreground">QuickPoll</span>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h1 className="text-xl font-bold font-display text-foreground mb-5">
            {question}
          </h1>

          {!hasVoted ? (
            <div className="space-y-2 mb-4">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                  className={`w-full text-left p-3.5 rounded-lg border-2 transition-all duration-200 ${
                    selectedOption === opt.id
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border hover:border-muted-foreground/30 text-foreground"
                  }`}
                >
                  <span className="font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {options.map((opt, i) => {
                const count = voteCounts[opt.id] || 0;
                const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
                return (
                  <div key={opt.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-foreground">{opt.label}</span>
                      <span className="text-muted-foreground">
                        {count} vote{count !== 1 ? "s" : ""} · {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-8 bg-muted rounded-md overflow-hidden relative">
                      <div
                        className={`h-full rounded-md animate-vote-bar ${CHART_COLORS[i % CHART_COLORS.length]}`}
                        style={{ width: `${pct}%`, opacity: 0.8 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!hasVoted ? (
            <Button
              onClick={handleVote}
              disabled={!selectedOption || voting}
              className="w-full font-semibold"
              size="lg"
            >
              {voting ? "Submitting..." : "Vote"}
            </Button>
          ) : (
            <div className="text-center text-sm text-muted-foreground">
              <p>
                {totalVotes} total vote{totalVotes !== 1 ? "s" : ""} · Results update
                live
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={copyLink}
            className="text-muted-foreground"
          >
            {copied ? (
              <Check className="w-4 h-4 mr-1.5" />
            ) : (
              <Copy className="w-4 h-4 mr-1.5" />
            )}
            {copied ? "Copied!" : "Copy share link"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ViewPoll;
