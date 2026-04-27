import { useEffect, useState } from 'react';
import api from '../api/axios';
import './AddWorkout.css';

function AddWorkout() {
  const [form, setForm] = useState({
    name: '',
    youtubeVideoUrl: '',
    muscleGroup: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [savingVideoFor, setSavingVideoFor] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [listError, setListError] = useState('');
  const [listSuccess, setListSuccess] = useState('');
  const [workouts, setWorkouts] = useState([]);
  const [videoDrafts, setVideoDrafts] = useState({});

  const fetchWorkouts = async () => {
    try {
      setLoadingList(true);
      const [libraryResponse, userWorkoutResponse] = await Promise.all([
        api.get('/workouts/library'),
        api.get('/workouts/mine'),
      ]);

      const fetchedWorkouts = libraryResponse.data.workouts || [];
      const userWorkouts = userWorkoutResponse.data.userWorkouts || [];

      const userWorkoutByWorkoutId = new Map(
        userWorkouts
          .filter((userWorkout) => userWorkout?.workout?._id)
          .map((userWorkout) => [String(userWorkout.workout._id), userWorkout])
      );

      setWorkouts(fetchedWorkouts);
      setVideoDrafts((prev) => {
        const next = { ...prev };

        fetchedWorkouts.forEach((workout) => {
          const workoutId = String(workout._id);

          if (next[workoutId] !== undefined) {
            return;
          }

          const userWorkout = userWorkoutByWorkoutId.get(workoutId);
          next[workoutId] = userWorkout?.customVideoUrl || workout.defaultVideoUrl || '';
        });

        return next;
      });
    } catch (_apiError) {
      setWorkouts([]);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/workouts/library', form);
      setSuccess('Workout added successfully.');
      setForm({
        name: '',
        youtubeVideoUrl: '',
        muscleGroup: '',
      });
      await fetchWorkouts();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to add workout');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoDraftChange = (workoutId, value) => {
    setVideoDrafts((prev) => ({
      ...prev,
      [workoutId]: value,
    }));
  };

  const saveWorkoutVideo = async (workoutId) => {
    try {
      setSavingVideoFor(workoutId);
      setListError('');
      setListSuccess('');

      await api.post('/workouts/mine', {
        workoutId,
        customVideoUrl: String(videoDrafts[workoutId] || '').trim(),
      });

      setListSuccess('Workout video updated.');
    } catch (apiError) {
      setListError(apiError?.response?.data?.message || 'Failed to update workout video');
    } finally {
      setSavingVideoFor('');
    }
  };

  return (
    <div className="add-workout-page">
      <div className="add-workout-layout">
        <div className="add-workout-card">
          <h2>Existing Workouts</h2>
          <p>All workouts currently available in your library. You can edit video links per workout.</p>

          {listError && <div className="form-error">{listError}</div>}
          {listSuccess && <div className="form-success">{listSuccess}</div>}

          {loadingList ? (
            <div className="list-empty">Loading workouts...</div>
          ) : workouts.length === 0 ? (
            <div className="list-empty">No workouts found.</div>
          ) : (
            <div className="workouts-list-grid">
              {workouts.map((workout) => (
                <div key={workout._id} className="workout-list-item">
                  <div className="workout-list-main">
                    <h3>{workout.name}</h3>
                    <p>Target: {workout.muscleGroup || 'N/A'}</p>
                    <div className="video-edit-row">
                      <input
                        type="url"
                        value={videoDrafts[String(workout._id)] || ''}
                        onChange={(e) => handleVideoDraftChange(String(workout._id), e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                      <button
                        type="button"
                        className="mini-save-btn"
                        onClick={() => saveWorkoutVideo(String(workout._id))}
                        disabled={savingVideoFor === String(workout._id)}
                      >
                        {savingVideoFor === String(workout._id) ? 'Saving...' : 'Save Video'}
                      </button>
                    </div>
                  </div>
                  {(videoDrafts[String(workout._id)] || workout.defaultVideoUrl) ? (
                    <a
                      href={videoDrafts[String(workout._id)] || workout.defaultVideoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="video-link"
                    >
                      Open video
                    </a>
                  ) : (
                    <span className="video-link disabled">No video</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="add-workout-card">
        <h1>Manage Workouts</h1>
        <p>Create a workout with name, YouTube video link, and target muscle group.</p>

        <form onSubmit={handleSubmit} className="add-workout-form">
          <label>
            Workout Name
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Incline Dumbbell Press"
              required
            />
          </label>

          <label>
            YouTube Video Link
            <input
              type="url"
              name="youtubeVideoUrl"
              value={form.youtubeVideoUrl}
              onChange={handleChange}
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
          </label>

          <label>
            Muscle Group
            <input
              type="text"
              name="muscleGroup"
              value={form.muscleGroup}
              onChange={handleChange}
              placeholder="e.g. Chest"
              required
            />
          </label>

          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Saving...' : 'Add Workout'}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}

export default AddWorkout;
