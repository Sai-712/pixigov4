import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { S3_BUCKET_NAME, s3Client } from '../config/aws';
import { AnimatedScene, AnimatedText, AnimatedBox, FloatingElement } from './AnimatedElements';
import { colors, transforms, shadows } from '../config/theme';

interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  photoCount: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [newEvent, setNewEvent] = useState({
    name: '',
    date: '',
    location: ''
  });

  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const savedEvents = localStorage.getItem('events');
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
  }, []);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const event: Event = {
      id: Date.now().toString(),
      ...newEvent,
      photoCount: 0
    };
    const updatedEvents = [...events, event];
    setEvents(updatedEvents);
    localStorage.setItem('events', JSON.stringify(updatedEvents));
    setShowCreateModal(false);
    setNewEvent({ name: '', date: '', location: '' });
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/event/${eventId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gradient-to-br from-champagne to-white">
      <AnimatedScene height="250px" className="mb-12">
        <FloatingElement>
          <AnimatedBox 
            position={[-1.5, 0, 0]} 
            color={colors.turquoise}
            scale={0.7}
            rotation={[0.5, 0.5, 0]}
            className="animate-float"
          />
          <AnimatedText 
            text="My Events"
            position={[0, 0, 0]}
            color={colors.aquamarine}
            size={0.5}
            className="animate-pulse"
          />
          <AnimatedBox 
            position={[1.5, 0, 0]} 
            color={colors.amaranthPink}
            scale={0.7}
            rotation={[0.5, -0.5, 0]}
            className="animate-float"
          />
        </FloatingElement>
      </AnimatedScene>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-turquoise transition-all duration-300 hover:text-aquamarine">My Events</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-turquoise to-aquamarine text-white px-6 py-3 rounded-lg transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          Create New Event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No events created yet. Create your first event to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300 ease-in-out">
          {events.map((event) => (
            <div
              key={event.id}
              onClick={() => handleEventClick(event.id)}
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-turquoise"
            >
              <h3 className="text-xl font-semibold text-turquoise mb-2">{event.name}</h3>
              <p className="text-aquamarine mb-1">{new Date(event.date).toLocaleDateString()}</p>
              <p className="text-gray-600 mb-4">{event.location}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-amaranthPink">{event.photoCount} photos</span>
                <button className="text-turquoise hover:text-aquamarine transition-colors duration-300">View Details</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Create New Event</h2>
            <form onSubmit={handleCreateEvent}>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Event Name</label>
                  <input
                    type="text"
                    value={newEvent.name}
                    onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Date</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Location</label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-turquoise to-aquamarine text-white rounded-lg transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  >
                    Create Event
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;