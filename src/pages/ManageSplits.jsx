import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../api/axios';
import './ManageSplits.css';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const createExerciseRow = () => ({
  workoutIds: [''],
  sets: 3,
  reps: '10-12',
  rest: '60s',
  notes: '',
});

const getDayLabel = (day) => day.charAt(0).toUpperCase() + day.slice(1);

const normalizeExerciseForForm = (exercise) => {
  const fallbackWorkoutIds = (exercise.options || []).map((option) => option.workoutId);
  const normalizedWorkoutIds = (exercise.workoutIds?.length ? exercise.workoutIds : fallbackWorkoutIds)
    .map((id) => String(id || '').trim())
    .filter(Boolean);

  return {
    workoutIds: normalizedWorkoutIds.length ? normalizedWorkoutIds : [''],
    sets: Number(exercise.sets) || 3,
    reps: String(exercise.reps || '10-12'),
    rest: String(exercise.rest || '60s'),
    notes: String(exercise.notes || ''),
  };
};

function ManageSplits() {
  const [workouts, setWorkouts] = useState([]);
  const [splits, setSplits] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templatePreviewDay, setTemplatePreviewDay] = useState('monday');
  const [selectedDay, setSelectedDay] = useState('monday');
  const [mobileView, setMobileView] = useState('templates');
  const [title, setTitle] = useState('');
  const [exercises, setExercises] = useState([createExerciseRow()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const [activeWorkoutMenuKey, setActiveWorkoutMenuKey] = useState('');
  const templateMenuRef = useRef(null);
  const workoutMenuRef = useRef(null);

  const splitMap = useMemo(
    () => new Map(splits.map((split) => [split.dayOfWeek, split])),
    [splits]
  );

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) || null,
    [templates, selectedTemplateId]
  );

  const templateDays = useMemo(() => {
    if (!selectedTemplate?.days?.length) {
      return [];
    }

    return [...selectedTemplate.days].sort(
      (a, b) => DAYS.indexOf(a.dayOfWeek) - DAYS.indexOf(b.dayOfWeek)
    );
  }, [selectedTemplate]);

  const templateDayMap = useMemo(
    () => new Map(templateDays.map((dayConfig) => [dayConfig.dayOfWeek, dayConfig])),
    [templateDays]
  );

  const configuredDaysCount = useMemo(
    () => splits.filter((split) => Array.isArray(split.exercises) && split.exercises.length).length,
    [splits]
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [workoutResponse, splitResponse, templateResponse] = await Promise.all([
        api.get('/workouts/library'),
        api.get('/workouts/splits'),
        api.get('/workouts/splits/templates'),
      ]);

      setWorkouts(workoutResponse.data.workouts || []);
      setSplits(splitResponse.data.splits || []);
      setTemplates(templateResponse.data.templates || []);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to load split data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!isTemplateMenuOpen) return;
    const handleOutsideClick = (event) => {
      if (templateMenuRef.current && !templateMenuRef.current.contains(event.target)) {
        setIsTemplateMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isTemplateMenuOpen]);

  useEffect(() => {
    if (!activeWorkoutMenuKey) return;
    const handleOutsideClick = (event) => {
      if (workoutMenuRef.current && !workoutMenuRef.current.contains(event.target)) {
        setActiveWorkoutMenuKey('');
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [activeWorkoutMenuKey]);

  useEffect(() => {
    if (!templates.length) {
      setSelectedTemplateId('');
      return;
    }

    setSelectedTemplateId((prev) => {
      if (templates.some((template) => template.id === prev)) {
        return prev;
      }

      return templates[0].id;
    });
  }, [templates]);

  useEffect(() => {
    if (!templateDays.length) {
      setTemplatePreviewDay('monday');
      return;
    }

    setTemplatePreviewDay((prev) => {
      if (templateDayMap.has(prev)) {
        return prev;
      }

      return templateDays[0].dayOfWeek;
    });
  }, [templateDays, templateDayMap]);

  useEffect(() => {
    const existing = splitMap.get(selectedDay);

    setActiveWorkoutMenuKey('');

    if (existing) {
      setTitle(existing.title || '');
      setExercises(
        existing.exercises.length
          ? existing.exercises.map((exercise) => normalizeExerciseForForm(exercise))
          : [createExerciseRow()]
      );
      return;
    }

    setTitle('');
    setExercises([createExerciseRow()]);
  }, [selectedDay, splitMap]);

  const updateExercise = (index, field, value) => {
    setExercises((prev) =>
      prev.map((exercise, exerciseIndex) =>
        exerciseIndex === index ? { ...exercise, [field]: value } : exercise
      )
    );
  };

  const updateWorkoutOption = (exerciseIndex, optionIndex, value) => {
    setExercises((prev) =>
      prev.map((exercise, currentExerciseIndex) => {
        if (exerciseIndex !== currentExerciseIndex) {
          return exercise;
        }

        const nextIds = [...exercise.workoutIds];
        nextIds[optionIndex] = value;

        return {
          ...exercise,
          workoutIds: nextIds,
        };
      })
    );
  };

  const getWorkoutOptionLabel = (workoutId) => {
    const selectedWorkout = workouts.find((workout) => String(workout._id) === String(workoutId || ''));

    if (!selectedWorkout) {
      return 'Select workout';
    }

    return `${selectedWorkout.name}${selectedWorkout.muscleGroup ? ` • ${selectedWorkout.muscleGroup}` : ''}`;
  };

  const addWorkoutOption = (exerciseIndex) => {
    setExercises((prev) =>
      prev.map((exercise, currentExerciseIndex) =>
        exerciseIndex === currentExerciseIndex
          ? { ...exercise, workoutIds: [...exercise.workoutIds, ''] }
          : exercise
      )
    );
  };

  const removeWorkoutOption = (exerciseIndex, optionIndex) => {
    setExercises((prev) =>
      prev.map((exercise, currentExerciseIndex) => {
        if (exerciseIndex !== currentExerciseIndex) {
          return exercise;
        }

        if (exercise.workoutIds.length === 1) {
          return { ...exercise, workoutIds: [''] };
        }

        return {
          ...exercise,
          workoutIds: exercise.workoutIds.filter((_, currentOptionIndex) => currentOptionIndex !== optionIndex),
        };
      })
    );
  };

  const addExercise = () => {
    setExercises((prev) => [...prev, createExerciseRow()]);
  };

  const removeExercise = (index) => {
    setExercises((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.put(`/workouts/splits/${selectedDay}`, {
        title,
        exercises: exercises.map((exercise) => ({
          ...exercise,
          workoutIds: [...new Set((exercise.workoutIds || []).map((item) => String(item).trim()).filter(Boolean))],
        })),
      });

      setSuccess('Split saved successfully.');
      await loadData();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to save split');
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = async () => {
    if (!selectedTemplateId) {
      return;
    }

    try {
      setApplyingTemplate(true);
      setError('');
      setSuccess('');

      await api.post(`/workouts/splits/templates/${selectedTemplateId}/apply`);
      setSuccess('Template applied. You can now edit any day below.');
      setMobileView('editor');
      await loadData();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to apply template');
    } finally {
      setApplyingTemplate(false);
    }
  };

  if (loading) {
    return <div className="manage-splits-page"><div className="manage-splits-layout">Loading splits...</div></div>;
  }

  const previewDay = templateDayMap.get(templatePreviewDay);

  return (
    <div className="manage-splits-page">
      <div className="mobile-view-switch" role="tablist" aria-label="Split planner mobile sections">
        <button
          type="button"
          role="tab"
          aria-selected={mobileView === 'templates'}
          className={`mobile-view-btn ${mobileView === 'templates' ? 'active' : ''}`}
          onClick={() => setMobileView('templates')}
        >
          Templates
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileView === 'editor'}
          className={`mobile-view-btn ${mobileView === 'editor' ? 'active' : ''}`}
          onClick={() => setMobileView('editor')}
        >
          Edit Split
        </button>
      </div>

      <div className="manage-splits-layout">
        <section className={`manage-splits-card side-card mobile-section ${mobileView !== 'templates' ? 'is-hidden-mobile' : ''}`}>
          <h1>Split Planner</h1>
          <p>Preview templates in detail, apply one, then edit your own weekly split.</p>

          <div className="template-picker">
            <div className="template-picker-header">
              <h3>Split Templates</h3>
              <span>{templates.length} template{templates.length === 1 ? '' : 's'}</span>
            </div>

            <div className="template-controls">
              <div className="template-picker-field" ref={templateMenuRef}>
                <span className="template-picker-label">Choose template</span>
                <button
                  type="button"
                  className="variation-picker-trigger"
                  aria-haspopup="listbox"
                  aria-expanded={isTemplateMenuOpen}
                  disabled={!templates.length}
                  onClick={() => setIsTemplateMenuOpen((prev) => !prev)}
                >
                  {templates.find((t) => t.id === selectedTemplateId)?.name
                    || (templates.length ? 'Select a template' : 'No templates available')}
                  <span className="variation-picker-caret" aria-hidden="true">▾</span>
                </button>
                {isTemplateMenuOpen && (
                  <div className="variation-picker-menu" role="listbox" aria-label="Choose split template">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        role="option"
                        aria-selected={template.id === selectedTemplateId}
                        className={`variation-picker-option${template.id === selectedTemplateId ? ' active' : ''}`}
                        onClick={() => {
                          setSelectedTemplateId(template.id);
                          setIsTemplateMenuOpen(false);
                        }}
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="submit-btn"
                onClick={applyTemplate}
                disabled={!selectedTemplateId || applyingTemplate}
              >
                {applyingTemplate ? 'Applying template...' : 'Apply Template To My Split'}
              </button>
            </div>

            {selectedTemplate && (
              <div className="template-preview">
                <div className="template-preview-head">
                  <h4>{selectedTemplate.name}</h4>
                  <p>{selectedTemplate.description || 'Template preview'}</p>
                </div>

                <div className="template-day-tabs" role="tablist" aria-label="Template days">
                  {DAYS.map((day) => {
                    const templateDay = templateDayMap.get(day);
                    const isActive = templatePreviewDay === day;

                    return (
                      <button
                        type="button"
                        key={day}
                        className={`template-day-tab ${isActive ? 'active' : ''}`}
                        onClick={() => templateDay && setTemplatePreviewDay(day)}
                        disabled={!templateDay}
                      >
                        {getDayLabel(day)}
                      </button>
                    );
                  })}
                </div>

                <div className="template-day-preview">
                  {previewDay ? (
                    <>
                      <div className="template-day-header">
                        <strong>{getDayLabel(previewDay.dayOfWeek)}</strong>
                        <span>{previewDay.exercises.length} exercises</span>
                      </div>
                      <p className="template-day-title">{previewDay.title}</p>

                      <div className="template-exercise-list">
                        {previewDay.exercises.map((exercise, index) => (
                          <div key={`${previewDay.dayOfWeek}-${index}`} className="template-exercise-item">
                            <div className="template-exercise-main">
                              <span className="exercise-index">#{index + 1}</span>
                              <div>
                                <strong>
                                  {(exercise.options || [])
                                    .map((option) => option.name)
                                    .filter(Boolean)
                                    .join(' / ') || 'Workout options'}
                                </strong>
                                {exercise.notes && <p>{exercise.notes}</p>}
                              </div>
                            </div>
                            <div className="template-exercise-meta">
                              <span>{exercise.sets} sets</span>
                              <span>{exercise.reps}</span>
                              <span>{exercise.rest} rest</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="empty-template-day">No workouts in this template day.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="split-list-panel">
            <div className="split-list-heading">
              <h3>Your Weekly Split</h3>
              <span>{configuredDaysCount}/7 days configured</span>
            </div>

            <div className="split-list">
            {DAYS.map((day) => {
              const split = splitMap.get(day);

              return (
                <button
                  key={day}
                  className={`split-day-card ${selectedDay === day ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedDay(day);
                    setMobileView('editor');
                  }}
                >
                  <div>
                    <strong>{getDayLabel(day)}</strong>
                    <p>{split?.title || 'No split created'}</p>
                  </div>
                  <span>{split?.exercises?.length || 0} exercises</span>
                </button>
              );
            })}
            </div>
          </div>
        </section>

        <section className={`manage-splits-card editor-card mobile-section ${mobileView !== 'editor' ? 'is-hidden-mobile' : ''}`}>
          <div className="editor-header">
            <h2>Edit {getDayLabel(selectedDay)} Split</h2>
            <span>{exercises.length} exercise block{exercises.length === 1 ? '' : 's'}</span>
          </div>

          <div className="editor-day-chips" role="tablist" aria-label="Select day to edit">
            {DAYS.map((day) => (
              <button
                key={`editor-day-${day}`}
                type="button"
                role="tab"
                aria-selected={selectedDay === day}
                className={`editor-day-chip ${selectedDay === day ? 'active' : ''}`}
                onClick={() => setSelectedDay(day)}
              >
                {getDayLabel(day).slice(0, 3)}
              </button>
            ))}
          </div>

          {(error || success) && (
            <div className="feedback-wrap">
              {error && <div className="form-error">{error}</div>}
              {success && <div className="form-success">{success}</div>}
            </div>
          )}

          <form className="split-form" onSubmit={handleSave}>
            <label>
              Split Title
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Chest + Triceps"
              />
            </label>

            <div className="split-exercises-header">
              <h3>Exercises</h3>
              <button type="button" className="mini-btn" onClick={addExercise}>+ Add Exercise</button>
            </div>

            <div className="split-exercise-list">
              {exercises.map((exercise, index) => (
                <div key={`${selectedDay}-${index}`} className="split-exercise-row">
                  <div className="exercise-row-title">
                    <h4>Exercise Block #{index + 1}</h4>
                  </div>

                  <div className="alternative-list-header">
                    <label>Workout Options (Alternatives)</label>
                    <button type="button" className="mini-btn" onClick={() => addWorkoutOption(index)}>
                      + Add Alternative
                    </button>
                  </div>

                  <div className="alternative-list">
                    {exercise.workoutIds.map((workoutId, optionIndex) => (
                      <div key={`${selectedDay}-${index}-${optionIndex}`} className="alternative-row">
                        <span className="alternative-label">Option {optionIndex + 1}</span>
                        <div
                          className="template-picker-field alternative-picker-field"
                          ref={activeWorkoutMenuKey === `${selectedDay}-${index}-${optionIndex}` ? workoutMenuRef : null}
                        >
                          <button
                            type="button"
                            className="variation-picker-trigger"
                            aria-haspopup="listbox"
                            aria-expanded={activeWorkoutMenuKey === `${selectedDay}-${index}-${optionIndex}`}
                            onClick={() =>
                              setActiveWorkoutMenuKey((prev) =>
                                prev === `${selectedDay}-${index}-${optionIndex}` ? '' : `${selectedDay}-${index}-${optionIndex}`
                              )
                            }
                          >
                            {getWorkoutOptionLabel(workoutId)}
                            <span className="variation-picker-caret" aria-hidden="true">▾</span>
                          </button>

                          {activeWorkoutMenuKey === `${selectedDay}-${index}-${optionIndex}` && (
                            <div className="variation-picker-menu" role="listbox" aria-label={`Choose workout for option ${optionIndex + 1}`}>
                              <button
                                type="button"
                                role="option"
                                aria-selected={!workoutId}
                                className={`variation-picker-option${!workoutId ? ' active' : ''}`}
                                onClick={() => {
                                  updateWorkoutOption(index, optionIndex, '');
                                  setActiveWorkoutMenuKey('');
                                }}
                              >
                                Select workout
                              </button>
                              {workouts.map((workout) => {
                                const value = String(workout._id);
                                const isSelected = value === String(workoutId || '');

                                return (
                                  <button
                                    key={value}
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    className={`variation-picker-option${isSelected ? ' active' : ''}`}
                                    onClick={() => {
                                      updateWorkoutOption(index, optionIndex, value);
                                      setActiveWorkoutMenuKey('');
                                    }}
                                  >
                                    {workout.name}{workout.muscleGroup ? ` • ${workout.muscleGroup}` : ''}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => removeWorkoutOption(index, optionIndex)}
                        >
                          Remove Option
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="split-row-grid">
                    <label>
                      Sets
                      <input
                        type="number"
                        min="1"
                        value={exercise.sets}
                        onChange={(e) => updateExercise(index, 'sets', e.target.value)}
                        required
                      />
                    </label>
                    <label>
                      Reps
                      <input
                        type="text"
                        value={exercise.reps}
                        onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                        placeholder="10-12"
                        required
                      />
                    </label>
                    <label>
                      Rest
                      <input
                        type="text"
                        value={exercise.rest}
                        onChange={(e) => updateExercise(index, 'rest', e.target.value)}
                        placeholder="60s"
                        required
                      />
                    </label>
                  </div>

                  <label>
                    Notes
                    <input
                      type="text"
                      value={exercise.notes}
                      onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                      placeholder="Optional coaching note"
                    />
                  </label>

                  <button type="button" className="remove-btn" onClick={() => removeExercise(index)}>
                    Remove Exercise Block
                  </button>
                </div>
              ))}
            </div>

            <div className="save-action-bar">
              <button type="submit" className="submit-btn" disabled={saving}>
                {saving ? 'Saving...' : `Save ${getDayLabel(selectedDay)}`}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

export default ManageSplits;
