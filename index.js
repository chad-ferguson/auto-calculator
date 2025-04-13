// Note management functions

function createNewNote() {
    const noteId = `note-${Date.now()}`;
    const noteData = {
      id: noteId,
      title: 'Untitled Note',
      timestamp: new Date().toISOString(),
      drawingHistory: [],
      preview: ""  // We'll store the canvas preview data here.
    };
    
    localStorage.setItem(noteId, JSON.stringify(noteData));
    window.location.href = `note.html?id=${noteId}`;
  }
  
  function deleteAllNotes() {
    if (confirm('Are you sure you want to delete all notes? This action cannot be undone.')) {
      // Get all note keys
      const noteKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('note-'));
      
      // Remove all notes
      noteKeys.forEach(key => localStorage.removeItem(key));
      
      // Reload the notes grid
      loadNotes();
    }
  }
  
  function loadNotes() {
    const notesGrid = document.getElementById('notesGrid');
    notesGrid.innerHTML = '';
  
    // Add New Note card
    const newNoteCard = document.createElement('div');
    newNoteCard.className = 'note-card new-note-card';
    newNoteCard.textContent = '+ New Note';
    newNoteCard.onclick = createNewNote;
    notesGrid.appendChild(newNoteCard);
  
    // Get all notes from localStorage
    const notes = Object.keys(localStorage)
      .filter(key => key.startsWith('note-'))
      .map(key => JSON.parse(localStorage.getItem(key)));
  
    // Add empty state if no notes found (aside from New Note card)
    if (notes.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.textContent = 'Click "+ New Note" to create your first note.';
      notesGrid.appendChild(emptyState);
      return;
    }
  
    // Add note cards
    notes.forEach(noteData => {
      const noteCard = document.createElement('div');
      noteCard.className = 'note-card';
  
      // If noteData.preview exists, display the image on the card.
      noteCard.innerHTML = noteData.preview ? `
        <img src="${noteData.preview}" alt="${noteData.title} preview">
        <h3>${noteData.title}</h3>
        <p>${new Date(noteData.timestamp).toLocaleDateString()}</p>
      ` : `
        <h3>${noteData.title}</h3>
        <p>${new Date(noteData.timestamp).toLocaleDateString()}</p>
      `;
      noteCard.onclick = () => window.location.href = `note.html?id=${noteData.id}`;
      notesGrid.appendChild(noteCard);
    });
  }
  
  // Initialize main page
  document.getElementById('newNoteBtn').addEventListener('click', createNewNote);
  document.getElementById('deleteAllBtn').addEventListener('click', deleteAllNotes);
  
  window.addEventListener('load', loadNotes);
  