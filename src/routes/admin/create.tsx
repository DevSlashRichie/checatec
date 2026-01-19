import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Plus, Trash2, Save, ArrowLeft, Image as ImageIcon } from "lucide-react";
import type { Form } from "../../lib/types";

export const Route = createFileRoute("/admin/create")({
  component: CreateForm,
});

function CreateForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createFormMutation = useMutation({
    mutationFn: (newForm: Omit<Form, "id" | "createdAt" | "status">) =>
      api.createForm(newForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      navigate({ to: "/admin" });
    },
  });

  const form = useForm({
    defaultValues: {
      title: "",
      questions: [
        {
          id: crypto.randomUUID(),
          text: "",
          answers: [
            { id: crypto.randomUUID(), label: "" },
            { id: crypto.randomUUID(), label: "" },
          ],
        },
      ],
    },
    onSubmit: async ({ value }) => {
      await createFormMutation.mutateAsync(value);
    },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate({ to: "/admin" })}
          className="text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Create New Form</h2>
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-8"
        >
          {/* Form Title */}
          <form.Field
            name="title"
            children={(field) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Form Title
                </label>
                <input
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium"
                  placeholder="e.g. Daily Check-in"
                />
              </div>
            )}
          />

          <hr className="border-gray-200" />

          {/* Dynamic Questions */}
          <form.Field
            name="questions"
            mode="array"
            children={(field) => (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Questions
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      field.pushValue({
                        id: crypto.randomUUID(),
                        text: "",
                        answers: [
                          { id: crypto.randomUUID(), label: "" },
                          { id: crypto.randomUUID(), label: "" },
                        ],
                      })
                    }
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <Plus size={16} /> Add Question
                  </button>
                </div>

                {field.state.value.map((_, qIndex) => (
                  <div
                    key={qIndex}
                    className="p-6 bg-gray-50 rounded-lg border border-gray-200 relative"
                  >
                    {field.state.value.length > 1 && (
                      <button
                        type="button"
                        onClick={() => field.removeValue(qIndex)}
                        className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                        title="Remove Question"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}

                    {/* Question Text */}
                    <form.Field
                      name={`questions[${qIndex}].text`}
                      children={(qField) => (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Question {qIndex + 1}
                          </label>
                          <input
                            value={qField.state.value}
                            onBlur={qField.handleBlur}
                            onChange={(e) =>
                              qField.handleChange(e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="What do you want to ask?"
                          />
                        </div>
                      )}

                    />

                    {/* Question Image Input */}
                    <form.Field
                      name={`questions[${qIndex}].imageUrl`}
                      children={(imgField) => (
                        <div className="mb-4">
                          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                            Question Image (Optional)
                          </label>

                          {imgField.state.value ? (
                            <div className="relative inline-block mt-2">
                              <img
                                src={imgField.state.value}
                                alt="Question Preview"
                                className="h-32 w-auto object-cover rounded border border-gray-300"
                              />
                              <button
                                type="button"
                                onClick={() => imgField.handleChange(undefined)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">
                                <ImageIcon size={16} />
                                <span>Upload Image</span>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      try {
                                        // Show loading state if needed? For now just await
                                        const url = await api.uploadFile(file);
                                        imgField.handleChange(url);
                                      } catch (err) {
                                        console.error("Upload failed", err);
                                        alert("Failed to upload image.");
                                      }
                                    }
                                  }}
                                />
                              </label>
                              <span className="text-xs text-gray-400">JPG, PNG, GIF up to 5MB</span>
                            </div>
                          )}
                        </div>
                      )}
                    />

                    {/* Answers */}
                    <form.Field
                      name={`questions[${qIndex}].answers`}
                      mode="array"
                      children={(aField) => (
                        <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-gray-500 uppercase">
                              Answers
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                aField.pushValue({
                                  id: crypto.randomUUID(),
                                  label: "",
                                })
                              }
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <Plus size={12} /> Add Answer
                            </button>
                          </div>
                          {aField.state.value.map((_, aIndex) => (
                            <div
                              key={aIndex}
                              className="flex items-center gap-2"
                            >
                              <form.Field
                                name={`questions[${qIndex}].answers[${aIndex}].label`}
                                children={(ansField) => (
                                  <input
                                    value={ansField.state.value}
                                    onBlur={ansField.handleBlur}
                                    onChange={(e) =>
                                      ansField.handleChange(e.target.value)
                                    }
                                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder={`Answer Option ${aIndex + 1}`}
                                  />
                                )}
                              />
                              {/* TODO: Image URL input */}
                              <button
                                type="button"
                                onClick={() => aField.removeValue(aIndex)}
                                className="text-gray-400 hover:text-red-500"
                                disabled={aField.state.value.length <= 1}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    />
                  </div>
                ))}
              </div>
            )}
          />

          <div className="pt-4 flex justify-end">
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 font-medium text-lg"
                >
                  {isSubmitting ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save size={20} /> Save Form
                    </>
                  )}
                </button>
              )}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
