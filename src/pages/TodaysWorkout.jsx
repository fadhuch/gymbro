import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './TodaysWorkout.css';

function TodaysWorkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [completedExercises, setCompletedExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingExerciseId, setSyncingExerciseId] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [weights, setWeights] = useState({});
  const [selectedOptions, setSelectedOptions] = useState({});
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [detailSlideIndex, setDetailSlideIndex] = useState(0);
  const [isVariationMenuOpen, setIsVariationMenuOpen] = useState(false);
  const variationMenuRef = useRef(null);
  const [todaysWorkout, setTodaysWorkout] = useState({
    title: '',
    dayLabel: '',
    exercises: [],
  });

  const getSelectedWorkoutId = (exercise) => selectedOptions[exercise.id] || exercise.options?.[0]?.workoutId;

  const getSelectedOption = (exercise) => {
    const selectedWorkoutId = getSelectedWorkoutId(exercise);
    return (exercise.options || []).find((option) => String(option.workoutId) === String(selectedWorkoutId));
  };

  const getFirstIncompleteIndex = (exercises, completedIds) => {
    const firstIncompleteIndex = (exercises || []).findIndex((exercise) => !completedIds.includes(exercise.id));
    return firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0;
  };

  const getSessionDateRange = () => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    return {
      from: start.toISOString(),
      to: end.toISOString(),
    };
  };

  const buildSessionExercises = (exerciseIds) => (
    todaysWorkout.exercises
      .filter((exercise) => exerciseIds.includes(exercise.id))
      .map((exercise) => {
        const selectedWorkoutId = selectedOptions[exercise.id] || exercise.options?.[0]?.workoutId;
        const selectedOption = (exercise.options || []).find(
          (option) => String(option.workoutId) === String(selectedWorkoutId)
        );

        return {
          exerciseId: exercise.id,
          userWorkoutId: selectedOption?.userWorkoutId,
          sets: Number(exercise.sets) || 0,
          reps: Number.parseInt(String(exercise.reps), 10) || 0,
          weight: Number(weights[exercise.id] || 0),
          durationMinutes: 10,
          caloriesBurned: 50,
        };
      })
  );

  const syncSessionState = async (exerciseIds, completed) => {
    const exercises = buildSessionExercises(exerciseIds);

    if (exercises.some((exercise) => !exercise.userWorkoutId)) {
      throw new Error('Please choose a workout variation before marking it complete.');
    }

    await api.post('/workouts/sessions', {
      sessionDate: new Date().toISOString(),
      exercises: exercises.map(({ exerciseId: _exerciseId, ...exercise }) => exercise),
      totalDurationMinutes: exercises.length * 10,
      totalCaloriesBurned: exercises.length * 50,
      isCompleted: completed,
    });
  };

  const getYoutubeEmbedUrl = (rawUrl) => {
    const url = String(rawUrl || '').trim();

    if (!url) {
      return '';
    }

    try {
      const parsed = new URL(url);

      if (parsed.hostname.includes('youtu.be')) {
        const videoId = parsed.pathname.replace('/', '').trim();
        return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
      }

      if (parsed.hostname.includes('youtube.com')) {
        if (parsed.pathname.startsWith('/embed/')) {
          return url;
        }

        if (parsed.pathname.startsWith('/shorts/')) {
          const videoId = parsed.pathname.replace('/shorts/', '').split('/')[0].trim();
          return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
        }

        const videoId = parsed.searchParams.get('v');
        return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
      }
    } catch (_error) {
      return '';
    }

    return '';
  };

  useEffect(() => {
    const fetchTodayWorkout = async () => {
      try {
        setLoading(true);
        setError('');

        const splitResponse = await api.get('/workouts/splits/today');
        const split = splitResponse.data.split;

        setTodaysWorkout(split);

        const nextSelectedOptions = (split.exercises || []).reduce((acc, exercise) => {
            acc[exercise.id] = exercise.options?.[0]?.workoutId || '';
            return acc;

          }, {});

        setSelectedOptions(nextSelectedOptions);

        if (!split.exercises?.length) {
          setCompletedExercises([]);
          setWeights({});
          setSaved(false);
          setIsSlideOpen(false);
          setActiveSlideIndex(0);
          return;
        }

        const { from, to } = getSessionDateRange();
        const sessionResponse = await api.get('/workouts/sessions', {
          params: { from, to },
        });

        const todaySession = sessionResponse.data.sessions?.[0];

        if (!todaySession) {
          setCompletedExercises([]);
          setWeights({});
          setSaved(false);
          setActiveSlideIndex(0);
          setIsSlideOpen(true);
          return;
        }

        const exerciseState = new Map();
        const completedIds = [];
        const nextWeights = {};
        const restoredOptions = { ...nextSelectedOptions };

        (todaySession.exercises || []).forEach((sessionExercise) => {
          exerciseState.set(String(sessionExercise.userWorkout?._id || sessionExercise.userWorkout), sessionExercise);
        });

        (split.exercises || []).forEach((exercise) => {
          const matchedOption = (exercise.options || []).find((option) =>
            exerciseState.has(String(option.userWorkoutId))
          );

          if (!matchedOption) {
            return;
          }

          completedIds.push(exercise.id);
          restoredOptions[exercise.id] = matchedOption.workoutId;

          const sessionExercise = exerciseState.get(String(matchedOption.userWorkoutId));
          if (sessionExercise?.weight) {
            nextWeights[exercise.id] = String(sessionExercise.weight);
          }
        });

        setSelectedOptions(restoredOptions);
        setCompletedExercises(completedIds);
        setWeights(nextWeights);
        setSaved(Boolean(todaySession.isCompleted));
        setActiveSlideIndex(getFirstIncompleteIndex(split.exercises, completedIds));
        setIsSlideOpen(true);
      } catch (apiError) {
        setError(apiError?.response?.data?.message || 'Failed to load today\'s workout');
      } finally {
        setLoading(false);
      }
    };

    fetchTodayWorkout();
  }, []);

  useEffect(() => {
    if (isSlideOpen) {
      setDetailSlideIndex(0);
    }
  }, [activeSlideIndex, isSlideOpen]);

  const toggleExercise = async (exerciseId) => {
    const nextCompletedExercises = completedExercises.includes(exerciseId)
      ? completedExercises.filter((id) => id !== exerciseId)
      : [...completedExercises, exerciseId];

    try {
      setSyncingExerciseId(exerciseId);
      setError('');

      await syncSessionState(
        nextCompletedExercises,
        todaysWorkout.exercises.length > 0 && nextCompletedExercises.length === todaysWorkout.exercises.length
      );

      setCompletedExercises(nextCompletedExercises);
      setSaved(nextCompletedExercises.length === todaysWorkout.exercises.length && todaysWorkout.exercises.length > 0);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || apiError.message || 'Failed to update exercise progress');
    } finally {
      setSyncingExerciseId('');
    }
  };

  const handleWeightChange = (exerciseId, value) => {
    setWeights((prev) => ({
      ...prev,
      [exerciseId]: value,
    }));
  };

  const handleOptionChange = (exerciseId, workoutId) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [exerciseId]: workoutId,
    }));
  };

  const handleSaveSession = async () => {
    try {
      setSaving(true);
      setError('');

      const exercises = buildSessionExercises(todaysWorkout.exercises.map((exercise) => exercise.id));

      if (exercises.some((exercise) => !exercise.userWorkoutId)) {
        setError('Please choose a workout variation for each exercise before saving.');
        setSaving(false);
        return;
      }

      await api.post('/workouts/sessions', {
        sessionDate: new Date().toISOString(),
        exercises: exercises.map(({ exerciseId: _exerciseId, ...exercise }) => exercise),
        totalDurationMinutes: todaysWorkout.exercises.length * 10,
        totalCaloriesBurned: todaysWorkout.exercises.length * 50,
        isCompleted: true,
      });

      setSaved(true);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to save workout session');
    } finally {
      setSaving(false);
    }
  };

  const progress = useMemo(() => {
    if (!todaysWorkout.exercises.length) {
      return 0;
    }

    return Math.round((completedExercises.length / todaysWorkout.exercises.length) * 100);
  }, [completedExercises.length, todaysWorkout.exercises.length]);

  const activeSlideExercise = todaysWorkout.exercises[activeSlideIndex] || null;
  const activeSelectedOption = activeSlideExercise ? getSelectedOption(activeSlideExercise) : null;
  const activeEmbedUrl = getYoutubeEmbedUrl(activeSelectedOption?.videoUrl || '');

  useEffect(() => {
    if (!isVariationMenuOpen) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      if (variationMenuRef.current && !variationMenuRef.current.contains(event.target)) {
        setIsVariationMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isVariationMenuOpen]);

  useEffect(() => {
    setIsVariationMenuOpen(false);
  }, [activeSlideIndex, detailSlideIndex, isSlideOpen]);

  const renderExerciseCard = (exercise, index, isSlide = false) => {
    const selectedOption = getSelectedOption(exercise);

    return (
      <div
        key={exercise.id}
        className={`exercise-card ${completedExercises.includes(exercise.id) ? 'completed' : ''} ${isSlide ? 'slide-card' : ''}`}
      >
        <div className="exercise-number">{index + 1}</div>
        <div className="exercise-details">
          <h3>{selectedOption?.name || 'Workout'}</h3>
          {(exercise.options || []).length > 1 && (
            <label className="weight-input-group">
              Choose Variation
              <select
                value={selectedOptions[exercise.id] || exercise.options?.[0]?.workoutId || ''}
                onChange={(e) => handleOptionChange(exercise.id, e.target.value)}
              >
                {(exercise.options || []).map((option) => (
                  <option key={`${exercise.id}-${option.workoutId}`} value={option.workoutId}>
                    {option.name} {option.muscleGroup ? `• ${option.muscleGroup}` : ''}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="exercise-specs">
            <span className="spec">📊 {exercise.sets} sets</span>
            <span className="spec">🔢 {exercise.reps} reps</span>
            <span className="spec">⏸️ {exercise.rest} rest</span>
            {selectedOption?.muscleGroup ? <span className="spec">🎯 {selectedOption.muscleGroup}</span> : null}
          </div>
          {exercise.notes && (
            <p className="exercise-notes">💡 {exercise.notes}</p>
          )}
          <div className="exercise-actions-row">
            <label className="weight-input-group">
              Last/Used Weight (kg)
              <input
                type="number"
                min="0"
                value={weights[exercise.id] || ''}
                onChange={(e) => handleWeightChange(exercise.id, e.target.value)}
                placeholder="0"
              />
            </label>

            {selectedOption?.videoUrl ? (
              <a href={selectedOption.videoUrl} target="_blank" rel="noreferrer" className="watch-link">
                Watch video
              </a>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={() => toggleExercise(exercise.id)}
          className={`complete-btn ${completedExercises.includes(exercise.id) ? 'done' : ''}`}
          disabled={syncingExerciseId === exercise.id}
        >
          {syncingExerciseId === exercise.id ? '...' : completedExercises.includes(exercise.id) ? '✓' : ''}
        </button>
      </div>
    );
  };

  if (loading) {
    return <div className="workout-container"><div className="workout-content">Loading today's workout...</div></div>;
  }

  return (
    <div className="workout-container">
      <nav className="workout-nav">
        <h2>Today's Workout</h2>
      </nav>

      <div className="workout-content">
        <div className="workout-header">
          <div className="workout-title">
            <h1>{todaysWorkout.title || 'No Split Planned'}</h1>
            <p className="workout-date">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="workout-meta">
            <span className="meta-item">🗓️ {todaysWorkout.dayLabel || 'Today'}</span>
            <span className="meta-item">⏱️ {todaysWorkout.exercises.length * 10} min</span>
            <span className="meta-item">💪 {todaysWorkout.exercises.length} exercises</span>
          </div>
        </div>

        {error && <div className="workout-error">{error}</div>}

        {!todaysWorkout.exercises.length && (
          <div className="empty-workout-card">
            <h3>No split for today</h3>
            <p>Create a split plan for {todaysWorkout.dayLabel || 'today'} and it will appear here.</p>
            <button onClick={() => navigate('/workout/splits')} className="finish-btn">
              Manage Splits
            </button>
          </div>
        )}

        {!!todaysWorkout.exercises.length && <div className="progress-container">
          <div className="progress-header">
            <span>Workout Progress</span>
            <span className="progress-text">{completedExercises.length}/{todaysWorkout.exercises.length} completed</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="progress-percentage">{progress}%</span>
        </div>}

        <div className="exercises-list">
          {todaysWorkout.exercises.map((exercise, index) => renderExerciseCard(exercise, index, false))}
        </div>

        {progress === 100 && !saved && !!todaysWorkout.exercises.length && (
          <div className="completion-message">
            <h2>Ready to save, {user?.firstname}?</h2>
            <p>All exercises are checked. Save this session to your workout history.</p>
            <button onClick={handleSaveSession} className="finish-btn" disabled={saving}>
              {saving ? 'Saving session...' : 'Save Workout Session'}
            </button>
          </div>
        )}

        {saved && (
          <div className="completion-message">
            <h2>🎉 Great Job, {user?.firstname}!</h2>
            <p>You've completed today's workout. Keep up the amazing work!</p>
            <button onClick={() => navigate('/dashboard')} className="finish-btn">
              Return to Dashboard
            </button>
          </div>
        )}
      </div>

      {isSlideOpen && !!todaysWorkout.exercises.length && (
        <div className="slide-fullscreen-overlay">
          <div className="slide-fullscreen-header">
            <h3>Slide View</h3>
            <button type="button" className="close-slide-btn" onClick={() => setIsSlideOpen(false)}>
              Close
            </button>
          </div>

          {!activeSlideExercise ? (
            <div className="empty-workout-card">No exercise available.</div>
          ) : (
            <>
              {(() => {
                const selectedOption = activeSelectedOption;
                const embedUrl = activeEmbedUrl;
                const detailSlideCount = 3;
                return (
                  <div className="slide-view-wrapper video-first-slide">
                    <div className="slide-hero">
                      {embedUrl ? (
                        <iframe
                          key={embedUrl}
                          src={embedUrl}
                          title={`${selectedOption?.name || 'Workout'} video`}
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      ) : (
                        <div className="slide-video-empty">No video linked for this variation.</div>
                      )}

                      <div className="slide-hero-overlay">
                        <p className="slide-hero-kicker">Your Workout</p>
                        <h3>{selectedOption?.name || 'Workout'}</h3>
                        <span>Exercise {activeSlideIndex + 1} / {todaysWorkout.exercises.length}</span>
                      </div>
                    </div>

                    <div className="slide-nav-row">
                      <button
                        type="button"
                        className="slide-nav-btn"
                        onClick={() => setActiveSlideIndex((prev) => Math.max(0, prev - 1))}
                        disabled={activeSlideIndex === 0}
                      >
                        Previous
                      </button>
                      <span className="slide-progress-label">
                        {selectedOption?.muscleGroup ? `${selectedOption.muscleGroup}` : 'Workout'}
                      </span>
                      <button
                        type="button"
                        className="slide-nav-btn"
                        onClick={() =>
                          setActiveSlideIndex((prev) => Math.min(todaysWorkout.exercises.length - 1, prev + 1))
                        }
                        disabled={activeSlideIndex === todaysWorkout.exercises.length - 1}
                      >
                        Next
                      </button>
                    </div>

                    <div className="slide-details-panel">
                      <div className="slide-detail-stage-header">
                        <div>
                          <p className="slide-detail-kicker">Workout Controls</p>
                          <h4>
                            {detailSlideIndex === 0
                              ? 'Choose Variation'
                              : detailSlideIndex === 1
                                ? 'Last Weight Used'
                                : 'Workout Details'}
                          </h4>
                        </div>
                        <span className="slide-detail-count">{detailSlideIndex + 1}/{detailSlideCount}</span>
                      </div>

                      <div className="slide-detail-stage">
                        {detailSlideIndex === 0 && (
                          <>
                            {(activeSlideExercise.options || []).length > 1 ? (
                              <div className="weight-input-group slide-stage-field slide-variation-field" ref={variationMenuRef}>
                                <span>Choose Variation</span>
                                <button
                                  type="button"
                                  className="variation-picker-trigger"
                                  aria-haspopup="listbox"
                                  aria-expanded={isVariationMenuOpen}
                                  onClick={() => setIsVariationMenuOpen((prev) => !prev)}
                                >
                                  {selectedOption?.name || 'Select variation'}
                                  <span className="variation-picker-caret" aria-hidden="true">▾</span>
                                </button>

                                {isVariationMenuOpen && (
                                  <div className="variation-picker-menu" role="listbox" aria-label="Choose workout variation">
                                    {(activeSlideExercise.options || []).map((option) => {
                                      const isSelected = String(option.workoutId) === String(
                                        selectedOptions[activeSlideExercise.id] || activeSlideExercise.options?.[0]?.workoutId || ''
                                      );

                                      return (
                                        <button
                                          key={`${activeSlideExercise.id}-${option.workoutId}`}
                                          type="button"
                                          role="option"
                                          aria-selected={isSelected}
                                          className={`variation-picker-option ${isSelected ? 'active' : ''}`}
                                          onClick={() => {
                                            handleOptionChange(activeSlideExercise.id, option.workoutId);
                                            setIsVariationMenuOpen(false);
                                          }}
                                        >
                                          {option.name} {option.muscleGroup ? `• ${option.muscleGroup}` : ''}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="slide-static-field">
                                <span className="slide-static-label">Selected Variation</span>
                                <strong>{selectedOption?.name || 'Workout'}</strong>
                              </div>
                            )}

                            <button
                              type="button"
                              className={`slide-complete-btn ${completedExercises.includes(activeSlideExercise.id) ? 'done' : ''}`}
                              onClick={() => toggleExercise(activeSlideExercise.id)}
                              disabled={syncingExerciseId === activeSlideExercise.id}
                            >
                              {syncingExerciseId === activeSlideExercise.id
                                ? 'Saving...'
                                : completedExercises.includes(activeSlideExercise.id)
                                  ? '✓ Completed'
                                  : 'Mark as Completed'}
                            </button>
                          </>
                        )}

                        {detailSlideIndex === 1 && (
                          <label className="weight-input-group slide-stage-field">
                            Last/Used Weight (kg)
                            <input
                              type="number"
                              min="0"
                              value={weights[activeSlideExercise.id] || ''}
                              onChange={(e) => handleWeightChange(activeSlideExercise.id, e.target.value)}
                              placeholder="0"
                            />
                          </label>
                        )}

                        {detailSlideIndex === 2 && (
                          <div className="slide-detail-stack">
                            <div className="slide-stats-row">
                              <span className="spec">📊 {activeSlideExercise.sets} sets</span>
                              <span className="spec">🔢 {activeSlideExercise.reps} reps</span>
                              <span className="spec">⏸️ {activeSlideExercise.rest} rest</span>
                              {selectedOption?.muscleGroup ? <span className="spec">🎯 {selectedOption.muscleGroup}</span> : null}
                            </div>
                            <div className="slide-notes-card">
                              <span className="slide-static-label">Notes</span>
                              <p>{activeSlideExercise.notes || 'No extra notes for this workout.'}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="slide-detail-nav">
                        <button
                          type="button"
                          className="slide-detail-nav-btn"
                          onClick={() => setDetailSlideIndex((prev) => Math.max(0, prev - 1))}
                          disabled={detailSlideIndex === 0}
                        >
                          Back
                        </button>
                        <div className="slide-detail-dots" aria-label="Detail slides">
                          {Array.from({ length: detailSlideCount }).map((_, index) => (
                            <span
                              key={`detail-dot-${index}`}
                              className={`slide-detail-dot ${detailSlideIndex === index ? 'active' : ''}`}
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          className="slide-detail-nav-btn"
                          onClick={() => setDetailSlideIndex((prev) => Math.min(detailSlideCount - 1, prev + 1))}
                          disabled={detailSlideIndex === detailSlideCount - 1}
                        >
                          Next
                        </button>
                      </div>
                    </div>

                    <div className="slide-option-rail" role="tablist" aria-label="All workouts">
                      {todaysWorkout.exercises.map((exercise, index) => {
                        const option = getSelectedOption(exercise);
                        const isActive = index === activeSlideIndex;
                        const isDone = completedExercises.includes(exercise.id);

                        return (
                          <button
                            key={`slide-rail-${exercise.id}`}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            className={`slide-option-chip ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                            onClick={() => setActiveSlideIndex(index)}
                          >
                            <span className="chip-index">{isDone ? '✓' : index + 1}</span>
                            <span className="chip-text">{option?.name || `Exercise ${index + 1}`}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default TodaysWorkout;
