import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { api } from '../../lib/api'
import type { Form } from '../../lib/types'
import { Plus, Archive, Play, Edit } from 'lucide-react'
import { useOptimisticMutation } from '../../hooks/useOptimisticMutation'

export const Route = createFileRoute('/admin/')({
    component: Dashboard,
})

const columnHelper = createColumnHelper<Form>()

function Dashboard() {
    const { data: forms = [], isLoading } = useQuery({
        queryKey: ['forms'],
        queryFn: api.getForms,
    })

    const queryClient = useQueryClient()

    // Using our global hook for generic optimistic updates
    const updateFormMutation = useOptimisticMutation<void, Error, { id: string, updates: Partial<Form> }>({
        mutationFn: ({ id, updates }) => api.updateForm(id, updates),
        queryKey: ['forms'],
        updater: (oldForms: Form[] | undefined, { id, updates }) => {
            return oldForms?.map(form =>
                form.id === id ? { ...form, ...updates } : form
            ) || []
        }
    })

    // Kept as standard mutation since activation might be more complex/critical
    // or arguably could also be optimistic, but let's stick to the requested refactor first
    const activateMutation = useMutation({
        mutationFn: api.setFormActive,
        onSuccess: () => {
            console.log("Form activated successfully");
            queryClient.invalidateQueries({ queryKey: ['forms'] })
        },
        onError: (error) => {
            console.error("Failed to activate form:", error);
            alert("Failed to activate form. Check console for details.");
        }
    })

    const columns = [
        columnHelper.accessor('title', {
            header: 'Title',
            cell: info => <span className="font-medium text-gray-900">{info.getValue()}</span>,
        }),
        columnHelper.accessor('status', {
            header: 'Status',
            cell: info => {
                const status = info.getValue()
                return (
                    <span className={`px-2 py-1 rounded text-xs font-semibold
            ${status === 'active' ? 'bg-green-100 text-green-800' :
                            status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}
          `}>
                        {status.toUpperCase()}
                    </span>
                )
            }
        }),
        columnHelper.accessor('randomizeQuestions', {
            header: 'Randomized',
            cell: info => {
                const isRandomized = info.getValue();
                const formId = info.row.original.id;
                return (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            updateFormMutation.mutate({ id: formId, updates: { randomizeQuestions: !isRandomized } });
                        }}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors border
                            ${isRandomized
                                ? 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200'
                                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 hover:text-gray-700'
                            }`}
                        title="Toggle Randomization"
                    >
                        {isRandomized ? 'Yes' : 'No'}
                    </button>
                )
            }
        }),
        columnHelper.accessor('createdAt', {
            header: 'Created',
            cell: info => {
                const date = info.getValue()?.toDate()
                return date ? date.toLocaleDateString() : '-'
            }
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Actions',
            cell: props => {
                const form = props.row.original
                return (
                    <div className="flex gap-2">
                        {form.status !== 'active' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    console.log("Activating form:", form.id);
                                    activateMutation.mutate(form.id);
                                }}
                                className="p-1 hover:bg-green-100 rounded text-green-600"
                                title="Set Active"
                            >
                                <Play size={16} />
                            </button>
                        )}

                        <Link
                            to="/admin/$formId"
                            params={{ formId: form.id }}
                            className="p-1 hover:bg-gray-100 rounded text-blue-600"
                            title="Overview & Stats"
                        >
                            <Edit size={16} />
                        </Link>

                        {form.status !== 'archived' ? (
                            <button
                                onClick={() => updateFormMutation.mutate({ id: form.id, updates: { status: 'archived' } })}
                                className="p-1 hover:bg-gray-100 rounded text-gray-600"
                                title="Archive"
                            >
                                <Archive size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={() => updateFormMutation.mutate({ id: form.id, updates: { status: 'draft' } })}
                                className="p-1 hover:bg-gray-100 rounded text-gray-600"
                                title="Unarchive (to Draft)"
                            >
                                <span className="text-xs font-bold">Draft</span>
                            </button>
                        )}
                    </div>
                )
            }
        })
    ]

    const table = useReactTable({
        data: forms,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    if (isLoading) return <div>Loading forms...</div>

    return (
        <div className="p-10">
            <div className="flex justify-between items-center mb-6">
                < h2 className="text-2xl font-bold text-gray-800" > Forms Dashboard</h2 >
                <Link
                    to="/admin/create"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                >
                    <Plus size={18} />
                    Create Form
                </Link>
            </div >

            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th key={header.id} className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                                    No forms found. Create one to get started.
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map(row => (
                                <tr key={row.id} className="hover:bg-gray-50">
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div >
    )
}
