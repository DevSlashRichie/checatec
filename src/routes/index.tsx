import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../lib/api'
import { CheckCircle } from 'lucide-react'

export const Route = createFileRoute('/')({
    component: Index,
})

function Index() {
    const { data: form, isLoading } = useQuery({
        queryKey: ['activeForm'],
        queryFn: api.getActiveForm,
    })

    // State to track current question index
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [completed, setCompleted] = useState(false)
    const [answers, setAnswers] = useState<{ questionId: string, answerId: string }[]>([])

    const submitMutation = useMutation({
        mutationFn: api.submitResponse,
        onSuccess: () => {
            setCompleted(true)
        }
    })

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-pulse text-xl font-medium text-gray-400">Loading form...</div>
            </div>
        )
    }

    if (!form) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">No Active Form</h1>
                    <p className="text-gray-500">Please check back later.</p>
                </div>
            </div>
        )
    }

    if (completed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-green-50 p-6 text-center animate-in fade-in duration-500">
                <div>
                    <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
                        <CheckCircle size={48} />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Thank You!</h1>
                    <p className="text-xl text-gray-600">Your response has been recorded.</p>
                </div>
            </div>
        )
    }

    const currentQuestion = form.questions[currentQuestionIndex]
    const isLastQuestion = currentQuestionIndex === form.questions.length - 1

    const handleAnswer = (answerId: string) => {
        // Save answer locally
        const newAnswers = [...answers, { questionId: currentQuestion.id, answerId }]
        setAnswers(newAnswers)

        if (isLastQuestion) {
            // Submit all
            submitMutation.mutate({
                formId: form.id,
                answers: newAnswers
            })
        } else {
            // Next question
            setCurrentQuestionIndex(prev => prev + 1)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Progress Bar */}
            <div className="h-2 bg-gray-200">
                <div
                    className="h-full bg-blue-600 transition-all duration-300 ease-out"
                    style={{ width: `${((currentQuestionIndex) / form.questions.length) * 100}%` }}
                ></div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-lg mx-auto w-full">
                <div className="w-full animate-in slide-in-from-right-8 fade-in duration-300" key={currentQuestion.id}>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12 leading-tight">
                        {currentQuestion.text}
                    </h2>

                    <div className="grid grid-cols-1 gap-4 w-full">
                        {currentQuestion.answers.map((answer) => (
                            <button
                                key={answer.id}
                                onClick={() => handleAnswer(answer.id)}
                                className="bg-white hover:bg-blue-50 active:bg-blue-100 text-gray-800 font-semibold py-6 px-8 rounded-2xl shadow-sm border-2 border-transparent hover:border-blue-500 transition-all duration-200 text-xl transform active:scale-95"
                            >
                                {answer.label ?? 'Image'}
                                {/* TODO: Handle Image Display if URL exists */}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-12 text-gray-400 text-sm">
                    Question {currentQuestionIndex + 1} of {form.questions.length}
                </div>
            </div>
        </div>
    )
}
