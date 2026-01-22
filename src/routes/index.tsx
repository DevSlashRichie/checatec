import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useState, useRef, useEffect, useMemo } from 'react'
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

    // Randomize questions if enabled
    // We use useMemo to ensure the order is stable for this session (until reload/fresh mount)
    // but random across different sessions.
    const questions = useMemo(() => {
        if (!form?.questions) return []
        if (!form.randomizeQuestions) return form.questions

        // Fischer-Yates Shuffle copy
        const shuffled = [...form.questions]
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled
    }, [form])

    // State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [completed, setCompleted] = useState(false)
    const [answers, setAnswers] = useState<{ questionId: string, answerId: string }[]>([])

    // Inactivity Timeout
    const TIMEOUT_MS = 10000 // 30 seconds
    // Use proper timeout type that works in both envs or just any/number
    const timerRef = useRef<any>(null)

    const submitMutation = useMutation({
        mutationFn: api.submitResponse,
        onSuccess: () => {
            // Logic handled in call sites or effects
        }
    })

    const resetForm = () => {
        setCurrentQuestionIndex(0)
        setAnswers([])
        setCompleted(false)
        if (timerRef.current) clearTimeout(timerRef.current)
    }

    const handleTimeout = () => {
        console.log("Inactivity timeout. Submitting partial response...")
        // Only submit if we have data and we explicitly want to capture partials
        // (form && answers.length > 0)
        if (form && answers.length > 0) {
            submitMutation.mutate({
                formId: form.id,
                answers: answers,
                status: 'partial'
            })
        }
        resetForm()
    }

    const resetTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(handleTimeout, TIMEOUT_MS)
    }

    // Effect for Timer and Listeners
    useEffect(() => {
        // Only run timer if form is loaded and not completed
        if (!form || completed) return

        resetTimer()

        const handleInteraction = () => resetTimer()
        window.addEventListener('click', handleInteraction)
        window.addEventListener('touchstart', handleInteraction)
        window.addEventListener('keydown', handleInteraction)

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
            window.removeEventListener('click', handleInteraction)
            window.removeEventListener('touchstart', handleInteraction)
            window.removeEventListener('keydown', handleInteraction)
        }
    }, [form, completed, answers, currentQuestionIndex])
    // Including dependencies ensures closure freshness for handleTimeout/answers access

    // Effect for Auto-Reset on Completion Screen
    useEffect(() => {
        if (completed) {
            const timeout = setTimeout(() => {
                resetForm()
            }, 5000) // 5 seconds on Thank You screen
            return () => clearTimeout(timeout)
        }
    }, [completed])


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

    const currentQuestion = questions[currentQuestionIndex]
    // Safety check just in case index is out of bounds
    if (!currentQuestion) {
        // Should not happen, but safe fallback
        return <div>Error: Question not found</div>
    }

    const isLastQuestion = currentQuestionIndex === questions.length - 1

    const handleAnswer = (answerId: string) => {
        // Save answer locally
        const newAnswers = [...answers, { questionId: currentQuestion.id, answerId }]
        setAnswers(newAnswers)

        // Reset timer explicitly to avoid race condition
        resetTimer()

        if (isLastQuestion) {
            // Submit all - Completed
            submitMutation.mutate({
                formId: form.id,
                answers: newAnswers,
                status: 'completed'
            })
            setCompleted(true)
            if (timerRef.current) clearTimeout(timerRef.current)
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
                    style={{ width: `${((currentQuestionIndex) / questions.length) * 100}%` }}
                ></div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-lg mx-auto w-full">
                <div className="w-full animate-in slide-in-from-right-8 fade-in duration-300" key={currentQuestion.id}>
                    {currentQuestion.imageUrl && (
                        <div className="mb-8 flex justify-center">
                            <img
                                src={currentQuestion.imageUrl}
                                alt="Question"
                                className="rounded-lg shadow-md max-h-64 object-cover w-full md:w-auto"
                            />
                        </div>
                    )}
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12 leading-tight">
                        {currentQuestion.text}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        {currentQuestion.answers.map((answer) => (
                            <button
                                key={answer.id}
                                onClick={() => handleAnswer(answer.id)}
                                className="bg-white hover:bg-blue-50 active:bg-blue-100 text-gray-800 font-semibold py-6 px-8 rounded-2xl shadow-sm border-2 border-transparent hover:border-blue-500 transition-all duration-200 text-xl transform active:scale-95 flex flex-col items-center gap-4"
                            >
                                {answer.imageUrl && (
                                    <img
                                        src={answer.imageUrl}
                                        alt="Answer"
                                        className="rounded-md max-h-40 object-cover w-full"
                                    />
                                )}
                                {answer.label && <span>{answer.label}</span>}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-12 text-gray-400 text-sm">
                    Question {currentQuestionIndex + 1} of {questions.length}
                </div>
            </div>
        </div>
    )
}
