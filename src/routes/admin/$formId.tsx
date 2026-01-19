import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { ArrowLeft, PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

export const Route = createFileRoute("/admin/$formId")({
  component: FormDetail,
});

function FormDetail() {
  const { formId } = Route.useParams();
  const { data: form, isLoading: formLoading } = useQuery({
    queryKey: ["forms", formId],
    queryFn: () => api.getFormById(formId),
  });

  const { data: responses = [], error: responsesError } = useQuery({
    queryKey: ["responses", formId],
    queryFn: () => api.getFormResponses(formId),
  });

  if (formLoading) return <div>Loading form...</div>;
  if (!form) return <div>Form not found.</div>;

  if (responsesError) {
    console.error("Error fetching responses:", responsesError);
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded border border-red-200">
        <h3 className="font-bold">Error loading stats</h3>
        <p>There was an error fetching the specific responses for this form.</p>
        <p className="text-sm mt-2 font-mono">{responsesError.message}</p>
        <p className="text-sm mt-2">
          <em>
            (Hint: Check browser console. Use the Firebase Index creation link
            if visible.)
          </em>
        </p>
      </div>
    );
  }

  // Calculate stats
  const completedResponses = responses.filter(
    (r) => r.status === "completed" || !r.status,
  ); // Backwards compat for old data
  const partialResponses = responses.filter((r) => r.status === "partial");

  const totalCompleted = completedResponses.length;
  const totalPartial = partialResponses.length;

  // Aggregate answers per question (using ALL responses to show total data captured)
  const stats = form.questions.map((q) => {
    const questionResponses = responses
      .map((r) => r.answers.find((a) => a.questionId === q.id)?.answerId)
      .filter(Boolean) as string[];

    const counts = questionResponses.reduce(
      (acc, curr) => {
        acc[curr] = (acc[curr] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      question: q,
      counts,
    };
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/admin" className="text-gray-500 hover:text-gray-800">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{form.title}</h2>
          <span
            className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold
            ${
              form.status === "active"
                ? "bg-green-100 text-green-800"
                : form.status === "draft"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
            }
          `}
          >
            {form.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium uppercase mb-2">
            Completed
          </h3>
          <p className="text-4xl font-bold text-gray-900">{totalCompleted}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium uppercase mb-2">
            Partial / Dropped
          </h3>
          <p className="text-4xl font-bold text-yellow-600">{totalPartial}</p>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <PieChartIcon size={24} /> Question Breakdown
        </h3>

        {stats.map((stat, idx) => {
          // Calculate total answers for THIS question to get accurate percentages
          const totalAnswersForQuestion = Object.values(stat.counts).reduce(
            (a, b) => a + b,
            0,
          );

          // Prepare data for Recharts
          const chartData = stat.question.answers
            .map((ans) => ({
              name: ans.label || "Image",
              value: stat.counts[ans.id] || 0,
            }))
            .filter((d) => d.value > 0);

          return (
            <div
              key={idx}
              className="bg-white p-6 rounded-lg shadow border border-gray-200"
            >
              <h4 className="font-semibold text-lg mb-4">
                {stat.question.text}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Chart */}
                <div className="h-64 w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.map((_entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                      No data for chart
                    </div>
                  )}
                </div>

                {/* List */}
                <div className="space-y-3">
                  {stat.question.answers.map((ans, ansIdx) => {
                    const count = stat.counts[ans.id] || 0;
                    const percentage =
                      totalAnswersForQuestion > 0
                        ? Math.round((count / totalAnswersForQuestion) * 100)
                        : 0;
                    const color = COLORS[ansIdx % COLORS.length];

                    return (
                      <div key={ans.id} className="relative">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700 flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: color }}
                            ></span>
                            {ans.label || "Image Answer"}
                          </span>
                          <span className="text-gray-500">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-2.5 rounded-full"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: color,
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-400 text-right">
                {totalAnswersForQuestion} responses to this question
              </div>
            </div>
          );
        })}

        {stats.length === 0 && (
          <p className="text-gray-500">No questions in this form.</p>
        )}
      </div>
    </div>
  );
}
