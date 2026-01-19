import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { ArrowLeft, PieChart } from 'lucide-react'

export const Route = createFileRoute('/admin/$formId')({
    component: FormDetail,
})

function FormDetail() {
    const { formId } = Route.useParams()
    const { data: form, isLoading: formLoading } = useQuery({
        queryKey: ['forms', formId],
        queryFn: () => api.getFormById(formId),
    })

    const { data: responses = [], isLoading: responsesLoading, error: responsesError } = useQuery({
        queryKey: ['responses', formId],
        queryFn: () => api.getFormResponses(formId),
    })

    if (formLoading) return <div>Loading form...</div>
    if (!form) return <div>Form not found.</div>

    if (responsesError) {
        console.error("Error fetching responses:", responsesError);
        return (
            <div className="p-4 bg-red-50 text-red-700 rounded border border-red-200">
                <h3 className="font-bold">Error loading stats</h3>
                <p>There was an error fetching the specific responses for this form.</p>
                <p className="text-sm mt-2 font-mono">{responsesError.message}</p>
                <p className="text-sm mt-2">
                    <em>(Hint: Check browser console. Use the Firebase Index creation link if visible.)</em>
                </p>
            </div>
        )
    }

    // Calculate simple stats
    const totalResponses = responses.length

    // Aggregate answers per question
    const stats = form.questions.map(q => {
        const questionResponses = responses.map(r =>
            r.answers.find(a => a.questionId === q.id)?.answerId
        ).filter(Boolean) as string[]

        const counts = questionResponses.reduce((acc, curr) => {
            acc[curr] = (acc[curr] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        return {
            question: q,
            counts
        }
    })

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <Link to="/admin" className="text-gray-500 hover:text-gray-800">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{form.title}</h2>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold
            ${form.status === 'active' ? 'bg-green-100 text-green-800' :
                            form.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}
          `}>
                        {form.status.toUpperCase()}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h3 className="text-gray-500 text-sm font-medium uppercase mb-2">Total Responses</h3>
                    <p className="text-4xl font-bold text-gray-900">{totalResponses}</p>
                </div>
                {/* Placeholders for other meta stats */}
            </div>

            <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <PieChart size={24} /> Question Breakdown
                </h3>

                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        <h4 className="font-semibold text-lg mb-4">{stat.question.text}</h4>
                        <div className="space-y-3">
                            {stat.question.answers.map(ans => {
                                const count = stat.counts[ans.id] || 0
                                const percentage = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0

                                return (
                                    <div key={ans.id} className="relative">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-700">{ans.label || 'Image Answer'}</span>
                                            <span className="text-gray-500">{count} ({percentage}%)</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className="bg-blue-600 h-2.5 rounded-full"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}

                {stats.length === 0 && <p className="text-gray-500">No questions in this form.</p>}
            </div>
        </div>
    )
}
