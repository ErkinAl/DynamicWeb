    // Initialize map
    var map = L.map('map').setView([20, 0], 2); // Default global view

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let landmarks = []; // Store landmarks
    let markers = []; // Store markers
    let selectedLandmarks = []; // Store selected landmarks for plan
    let removedLandmarks = []; // Çıkarılan landmarklar burada tutulacak
    let visitedLandmarkIds = []; // Store IDs of landmarks that have been visited
    let filteredLandmarks = []; // Store filtered landmarks for search/filter
    let isFiltering = false; // Flag to track if we're currently filtering

    // Load landmarks from database when page loads
    loadLandmarksFromDatabase();
    // Load visited landmarks to track which ones have been visited
    loadVisitedLandmarkIds();

    // Add event listeners for filter controls
    document.addEventListener('DOMContentLoaded', function() {
        // Category filter change
        document.getElementById('filterCategory').addEventListener('change', applyFilters);
        
        // Checkbox filters change
        document.getElementById('filterHasNotes').addEventListener('change', applyFilters);
        document.getElementById('filterVisited').addEventListener('change', applyFilters);
        
        // Search input - trigger search on Enter key
        document.getElementById('landmarkSearch').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchLandmarks();
            }
        });
        
        // New event listeners for visited landmarks filters
        document.getElementById('visitedFilterCategory').addEventListener('change', applyVisitedFilters);
        document.getElementById('visitedFilterHasLandmarkNotes').addEventListener('change', applyVisitedFilters);
        document.getElementById('visitedFilterHasVisitNotes').addEventListener('change', applyVisitedFilters);
        document.getElementById('visitedLandmarkSearch').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchVisitedLandmarks();
            }
        });
    });

    // Function to load landmarks from database
    async function loadLandmarksFromDatabase() {
        console.log(landmarks);
        console.log(markers);
        console.log(selectedLandmarks);

        try {
            console.log('Loading landmarks from database...');
            const response = await fetch('/api/landmarks');
            if (!response.ok) {
                throw new Error('Failed to fetch landmarks');
            }
            
            const loadedLandmarks = await response.json();
            console.log('Landmarks loaded:', loadedLandmarks);
            
            // Add each landmark to map and arrays
            loadedLandmarks.forEach(landmark => {
                const lat = landmark.location.latitude;
                const lng = landmark.location.longitude;
                
                // Create popup content including notes if they exist
                const popupContent = `
                    <b>${landmark.name}</b><br>
                    ${landmark.description}<br>
                    ${landmark.notes ? `<p><strong>Notes:</strong> ${landmark.notes}</p>` : ''}
                `;
                
                // Create marker
                const marker = L.marker([lat, lng]).addTo(map)
                    .bindPopup(popupContent);
                
                // Add to arrays
                markers.push(marker);
                landmarks.push({ 
                    latitude: lat.toFixed(6), 
                    longitude: lng.toFixed(6),
                    id: landmark._id,
                    name: landmark.name,
                    notes: landmark.notes,
                    category: landmark.category,
                    description: landmark.description
                });
            });
            
            // Update UI
            updateLandmarkList();
        } catch (error) {
            console.error('Error loading landmarks:', error);
        }
    }
    
    // Add landmark on map click
    map.on('click', function(e) {
        var lat = e.latlng.lat.toFixed(6);
        var lng = e.latlng.lng.toFixed(6);

        // Landmark zaten var mı kontrol et
        let landmarkIndex = landmarks.findIndex(l => l.latitude === lat && l.longitude === lng);
        if (landmarkIndex === -1) {
            // Form HTML'i oluştur
            var formHtml = `
                <div>
                    <label>Name:</label><br>
                    <input type="text" id="landmark-name"><br><br>
    
                    <label>Description:</label><br>
                    <textarea id="landmark-description"></textarea><br><br>
    
                    <label>Category:</label><br>
                    <select id="landmark-category">
                        <option value="historical">Historical</option>
                        <option value="natural">Natural</option>
                        <option value="cultural">Cultural</option>
                    </select><br><br>
    
                    <button id="save-landmark" onclick="saveLandmarkFromPopup('${lat}', '${lng}')">Save Landmark</button>
                </div>
            `;
    
            // Popup aç
            var popup = L.popup()
                .setLatLng(e.latlng)
                .setContent(formHtml)
                .openOn(map);
            
            console.log('Popup opened with inline onclick handler');
        }
    });
    
    // Global function to save landmark from popup
    function saveLandmarkFromPopup(lat, lng) {
        console.log('saveLandmarkFromPopup called with:', lat, lng);
        
        var name = document.getElementById('landmark-name').value;
        var description = document.getElementById('landmark-description').value;
        var category = document.getElementById('landmark-category').value;
        
        console.log('Form data:', { name, description, category, lat, lng });
        
        // Backend'e gönder
        console.log('Sending fetch request to /api/landmarks');
        fetch('/api/landmarks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                description,
                category,
                location: {
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lng)
                }
            })
        })
        .then(response => {
            console.log('Response received:', response);
            return response.json();
        })
        .then(data => {
            console.log('Landmark saved:', data);
            
            // Haritaya marker ekle
            const popupContent = `
                <b>${name}</b><br>
                ${description}
            `;
            
            var marker = L.marker([parseFloat(lat), parseFloat(lng)]).addTo(map)
                .bindPopup(popupContent)
                .openPopup();
            markers.push(marker);
            
            // Store landmark with ID from database
            landmarks.push({ 
                latitude: lat, 
                longitude: lng,
                id: data._id,
                name: name,
                category: category,
                description: description
            });
            
            // No longer automatically selecting new landmarks - user will select manually
            
            updateLandmarkList();
            updateSelectedLandmarksList();
            map.closePopup(); // Popupı kapat
        })
        .catch(error => {
            console.error('Error saving landmark:', error);
        });
    }
    


    // Update landmark list in UI
    function updateLandmarkList() {
        let list = document.getElementById('landmarkList');
        list.innerHTML = "";
        
        // Determine which landmarks to display
        const landmarksToShow = isFiltering ? filteredLandmarks : landmarks;
        
        // Add a counter for filtered results
        if (isFiltering) {
            const filterInfo = document.createElement('div');
            filterInfo.className = 'alert alert-info';
            filterInfo.innerHTML = `Showing ${landmarksToShow.length} of ${landmarks.length} landmarks`;
            list.appendChild(filterInfo);
        }
        
        landmarksToShow.forEach((point, index) => {
            // Seçili mi kontrol et
            const isSelected = selectedLandmarks.some(
                l => l.position.lat == point.latitude && l.position.lng == point.longitude
            );
            
            // Has been visited before?
            const isVisited = point.id && visitedLandmarkIds.includes(point.id);

            let li = document.createElement('li');
            li.innerHTML = `
                <div class="landmark-item">
                    <div>
                        <strong>Landmark ${index + 1}</strong>: Lat ${point.latitude}, Lng ${point.longitude}
                        ${point.name ? `<br>Name: ${point.name}` : ''}
                        ${point.category ? `<br><span class="badge bg-info">${point.category}</span>` : ''}
                        <div class="landmark-status">
                            ${point.notes ? `<span class="text-success">Has Notes ✓</span>` : ''}
                            ${isVisited ? `<span class="text-primary ms-2">Previously Visited ✓</span>` : ''}
                        </div>
                    </div>
                    <div class="landmark-actions">
                        ${isSelected
                    ? `<button class="btn btn-warning btn-sm" onclick="deselectLandmark(${point.latitude}, ${point.longitude})">Deselect</button>`
                    : `<button class="btn btn-success btn-sm" onclick="selectLandmark(${point.latitude}, ${point.longitude})">Select</button>`
                        }
                        <button class="btn btn-info btn-sm" onclick="editLandmark(${point.latitude}, ${point.longitude})">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="removeLandmarkByLatLng(${point.latitude}, ${point.longitude})">Delete</button>
                    </div>
                </div>
            `;
            list.appendChild(li);
        });
        
        // Show a message if no landmarks match the filter
        if (isFiltering && landmarksToShow.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'alert alert-warning';
            noResults.textContent = 'No landmarks match your search or filter criteria.';
            list.appendChild(noResults);
        }
    }

    // Modal açma fonksiyonları
    function openAddNotesModal() {
        if (selectedLandmarks.length === 0) {
            alert("Please select at least one landmark first!");
            return;
        }
        
        // Update the count of selected landmarks
        document.getElementById('selectedLandmarksCount').textContent = selectedLandmarks.length;
        
        const modal = new bootstrap.Modal(document.getElementById('addNotesModal'));
        modal.show();
    }

    function openVisitedLandmarksModal() {
        loadVisitedLandmarks();
        const modal = new bootstrap.Modal(document.getElementById('visitedLandmarksModal'));
        modal.show();
    }

    // Plan bölümünü göster/gizle
    function togglePlanSection() {
        const planSection = document.getElementById('planSection');
        
        // Count initially selected landmarks and visited ones
        const totalSelected = selectedLandmarks.length;
        const visitedCount = selectedLandmarks.filter(landmark => landmark.isVisited).length;
        
        // Filter out visited landmarks for the visiting plan section
        const eligibleLandmarks = selectedLandmarks.filter(landmark => !landmark.isVisited);
        
        // Only show notification if we're about to display the section
        if (planSection.style.display === 'none' || planSection.style.display === '') {
            // Check if there are any selected landmarks at all
            if (totalSelected === 0) {
                alert('Please select at least one landmark first!');
                return;
            }
            
            // Check if there are any landmarks that can be added to the plan (not visited)
            if (eligibleLandmarks.length === 0) {
                alert('All selected landmarks have already been visited. Please select landmarks that have not been visited yet.');
                return;
            }
            
            // If some landmarks will be filtered out, notify the user
            if (visitedCount > 0) {
                alert(`${visitedCount} of your selected landmarks have already been visited and won't appear in the visiting plan.`);
            }
            
            // Update the plan with only eligible landmarks
            const tempSelected = [...selectedLandmarks]; // Preserve the original selection
            selectedLandmarks = eligibleLandmarks;
            updateSelectedLandmarksList();
            selectedLandmarks = tempSelected; // Restore original selection after updating UI
            
            planSection.style.display = 'block';
        } else {
            planSection.style.display = 'none';
        }
    }

    // Landmark kaydetme
    async function saveLandmark() {
        const name = document.getElementById('landmarkName').value;
        const category = document.getElementById('landmarkCategory').value;
        const description = document.getElementById('landmarkDescription').value;
        const note = document.getElementById('landmarkNote').value;

        if (!name || !category || !description || !note) {
            alert('Please fill in all fields!');
            return;
        }

        const lastLandmark = landmarks[landmarks.length - 1];
        if (!lastLandmark) {
            alert('Please select a location on the map first!');
            return;
        }

        const landmark = {
            name,
            location: {
                latitude: lastLandmark.latitude,
                longitude: lastLandmark.longitude
            },
            description,
            category
        };

        try {
            const response = await fetch('/api/landmarks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(landmark)
            });

            if (response.ok) {
                const savedLandmark = await response.json();
                
                // Ziyaret kaydı oluştur
                const visit = {
                    landmark_id: savedLandmark._id,
                    visitor_name: 'User',
                    notes: note
                };

                await fetch('/api/visited', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(visit)
                });

                alert('Landmark saved successfully!');
                bootstrap.Modal.getInstance(document.getElementById('addNotesModal')).hide();
            } else {
                throw new Error('Failed to save landmark');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred!');
        }
    }

    // Ziyaret edilen yerleri yükleme
    async function loadVisitedLandmarks() {
        console.log('Loading visited landmarks...');
        try {
            const response = await fetch('/api/visited');
            if (!response.ok) {
                throw new Error('Failed to fetch visited landmarks');
            }
            
            const visits = await response.json();
            console.log('Visits loaded (full data):', JSON.stringify(visits, null, 2));
            
            // Store all visits for filtering
            allVisits = visits;
            
            // Reset filtering state when modal is opened
            isVisitFiltering = false;
            filteredVisits = [];
            
            // Reset filter controls
            document.getElementById('visitedLandmarkSearch').value = '';
            document.getElementById('visitedFilterCategory').value = '';
            document.getElementById('visitedFilterHasLandmarkNotes').checked = false;
            document.getElementById('visitedFilterHasVisitNotes').checked = false;
            document.getElementById('visitedFilterResults').style.display = 'none';
            
            // Display all visits
            displayVisitedLandmarks(visits);
            
        } catch (error) {
            console.error('Error loading visited landmarks:', error);
            document.getElementById('visitedLandmarksList').innerHTML = 
                `<div class="alert alert-danger">Error loading visited landmarks: ${error.message}</div>`;
        }
    }

    function updateSelectedLandmarksList() {
        const container = document.getElementById('selectedLandmarks');
        container.innerHTML = '';

        // Only show non-visited landmarks in the plan section
        const eligibleLandmarks = selectedLandmarks.filter(landmark => !landmark.isVisited);
        
        if (eligibleLandmarks.length === 0) {
            container.innerHTML = '<div class="alert alert-info">No landmarks selected for visiting plan. Please select landmarks first.</div>';
            return;
        }
        
        // Add explanation about the different types of notes
        const notesExplanation = document.createElement('div');
        notesExplanation.className = 'alert alert-info mb-3';
        notesExplanation.innerHTML = `
            <strong>Important:</strong> Visiting notes are separate from landmark notes. 
            Landmark notes are permanent and attached to the landmark itself, while visiting notes 
            are specific to this particular visit.
        `;
        container.appendChild(notesExplanation);
        
        eligibleLandmarks.forEach((landmark, index) => {
            const item = document.createElement('div');
            item.className = 'plan-item';
            
            // Get the full landmark data if available
            const landmarkData = landmarks.find(l => 
                l.latitude == landmark.position.lat && 
                l.longitude == landmark.position.lng
            );
            
            // Show existing landmark notes if any (for reference)
            const existingNotes = landmarkData && landmarkData.notes ? 
                `<div class="mb-2 p-2 bg-light border rounded">
                    <strong>Existing Landmark Notes:</strong> ${landmarkData.notes}
                    <small class="d-block text-muted">(These notes are permanently attached to the landmark)</small>
                </div>` : '';
            
            // Make sure we preserve any existing visit notes
            const existingVisitNotes = landmark.visitNotes || '';
            console.log(`Rendering landmark ${index} with existing visit notes:`, existingVisitNotes);
            
            item.innerHTML = `
                <div class="landmark-plan-item">
                    <div class="landmark-info">
                        <h5>${landmark.name}</h5>
                        <p>Location: ${landmark.position.lat}, ${landmark.position.lng}</p>
                    </div>
                    ${existingNotes}
                    <div class="landmark-plan-notes mb-2">
                        <label class="form-label">
                            <strong>Visiting Notes</strong> 
                            <small class="text-muted">(These notes are specific to this visit only)</small>:
                        </label>
                        <textarea class="form-control visit-note" data-landmark-index="${index}" rows="2" 
                          placeholder="Add notes about your visit to this landmark...">${existingVisitNotes}</textarea>
                    </div>
                </div>
            `;
            container.appendChild(item);
        });
        
        // Add event listeners to save notes when they change
        document.querySelectorAll('.visit-note').forEach(textarea => {
            // Remove existing event listeners first to prevent duplicates
            textarea.removeEventListener('input', handleVisitNoteChange);
            textarea.removeEventListener('change', handleVisitNoteChange);
            
            // Add new event listeners
            textarea.addEventListener('input', handleVisitNoteChange);
            textarea.addEventListener('change', handleVisitNoteChange);
        });
    }

    // Separate function to handle visit note changes
    function handleVisitNoteChange(event) {
        const textarea = event.target;
        const index = parseInt(textarea.getAttribute('data-landmark-index'));
        const notes = textarea.value;
        
        // Find the corresponding landmark in the eligibleLandmarks array
        const eligibleLandmarks = selectedLandmarks.filter(landmark => !landmark.isVisited);
        
        if (!isNaN(index) && index < eligibleLandmarks.length) {
            eligibleLandmarks[index].visitNotes = notes;
            selectedLandmarks.forEach(landmark => {
                if (landmark.position.lat == eligibleLandmarks[index].position.lat &&
                    landmark.position.lng == eligibleLandmarks[index].position.lng) {
                    landmark.visitNotes = notes;
                }
            });
            console.log(`Updated visit notes for landmark ${index}:`, notes);
        }
    }

    function removeFromPlan(index) {
        selectedLandmarks.splice(index, 1);
        updateSelectedLandmarksList();
    }

    async function savePlan() {
        // First, filter out any visited landmarks
        const eligibleLandmarks = selectedLandmarks.filter(landmark => !landmark.isVisited);
        
        if (eligibleLandmarks.length === 0) {
            alert('No eligible landmarks to mark as visited. Please select landmarks that have not been visited yet.');
            return;
        }

        // Get visitor name from input field
        const visitorNameInput = document.getElementById('visitorName');
        const visitorName = visitorNameInput.value.trim();
        
        // Validate visitor name
        if (!visitorName) {
            alert('Please enter your name before marking landmarks as visited.');
            visitorNameInput.focus();
            return;
        }

        try {
            console.log(`Marking ${eligibleLandmarks.length} landmarks as visited by ${visitorName}`);
            
            // Force update notes from textareas before saving
            document.querySelectorAll('.visit-note').forEach(textarea => {
                const index = parseInt(textarea.getAttribute('data-landmark-index'));
                if (!isNaN(index) && index < eligibleLandmarks.length) {
                    const notes = textarea.value;
                    eligibleLandmarks[index].visitNotes = notes;
                    console.log(`Final collection of notes for landmark ${index}:`, notes);
                }
            });
            
            console.log('Eligible landmarks with notes for saving:', JSON.stringify(eligibleLandmarks.map(l => ({
                name: l.name,
                visitNotes: l.visitNotes
            })), null, 2));
            
            // Mark each landmark as visited
            const visitPromises = [];
            
            for (let i = 0; i < eligibleLandmarks.length; i++) {
                const landmark = eligibleLandmarks[i];
                
                // Find the landmark in the database
                const landmarkData = landmarks.find(l => 
                    l.latitude == landmark.position.lat && 
                    l.longitude == landmark.position.lng
                );
                
                if (!landmarkData || !landmarkData.id) {
                    console.warn(`Landmark not found in database: ${landmark.name}`);
                    continue;
                }

                // Get visit notes - ensure we have the most recent value
                const visitNotes = landmark.visitNotes || '';
                
                // Double-check the value from the textarea directly
                const textarea = document.querySelector(`.visit-note[data-landmark-index="${i}"]`);
                const textareaValue = textarea ? textarea.value : '';
                
                if (textareaValue !== visitNotes) {
                    console.warn(`⚠️ Warning: Textarea value (${textareaValue}) doesn't match stored visitNotes (${visitNotes}). Using textarea value.`);
                }
                
                // Use the textarea value for notes if it exists, ensure it's a string
                const finalNotes = textareaValue || visitNotes || '';
                console.log(`Visit notes for ${landmark.name} (type: ${typeof finalNotes}):`, finalNotes);
                
                // Create visited record with the separate visit notes
                const requestBody = {
                    landmark_id: landmarkData.id,
                    visitor_name: visitorName,
                    notes: finalNotes // Ensure this is a string
                };
                
                console.log(`Sending visit record for landmark ${i}:`, JSON.stringify(requestBody, null, 2));
                
                // Validate notes field before sending
                if (requestBody.notes === undefined || requestBody.notes === null) {
                    console.warn('⚠️ Warning: Notes are undefined or null, setting to empty string');
                    requestBody.notes = '';
                }
                
                const visitPromise = fetch('/api/visited', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to save visit: ${response.status} ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log(`Visit saved successfully for landmark ${i}:`, JSON.stringify(data, null, 2));
                    
                    // Look for notes in different places of the response
                    const savedNotes = data.notes || data.notesDirectAccess || '';
                    
                    console.log('Response analysis:', {
                        hasDirectNotes: 'notes' in data,
                        directNotesValue: data.notes,
                        hasNotesDirectAccess: 'notesDirectAccess' in data,
                        notesDirectAccessValue: data.notesDirectAccess, 
                        finalNotesValue: savedNotes
                    });
                    
                    // Validate if the saved notes match what we sent
                    if (savedNotes !== finalNotes) {
                        console.warn(`⚠️ WARNING: Saved notes do not match the notes we sent for landmark ${i}!`);
                        console.warn(`Sent: "${finalNotes}"`);
                        console.warn(`Saved: "${savedNotes}"`);
                    } else {
                        console.log(`✓ Notes successfully saved for landmark ${i}`);
                    }
                    
                    return data;
                })
                .catch(error => {
                    console.error(`Error saving visit for landmark ${i}:`, error);
                    throw error;
                });
                
                visitPromises.push(visitPromise);
            }
            
            // Wait for all visit records to be created
            const results = await Promise.all(visitPromises);
            console.log('All visits saved:', results);
            
            alert('Landmarks marked as visited successfully!');
            
            // Reset UI
        document.getElementById('planSection').style.display = 'none';
            
            // Update selected landmarks to remove now-visited landmarks
            selectedLandmarks = selectedLandmarks.filter(landmark => {
                if (!landmark.isVisited) {
                    // Check if this landmark was just marked as visited
                    const landmarkData = landmarks.find(l => 
                        l.latitude == landmark.position.lat && 
                        l.longitude == landmark.position.lng
                    );
                    
                    // If it was in eligibleLandmarks, mark it as now visited
                    if (eligibleLandmarks.some(l => 
                        l.position.lat == landmark.position.lat && 
                        l.position.lng == landmark.position.lng
                    )) {
                        landmark.isVisited = true;
                        return false; // Remove from selected landmarks
                    }
                }
                return !landmark.isVisited; // Keep only non-visited landmarks
            });
            
            updateSelectedLandmarksList();
            
            // Reload visited landmark IDs to update the UI
            await loadVisitedLandmarkIds();
            
        } catch (error) {
            console.error('Error marking landmarks as visited:', error);
            alert('Failed to mark landmarks as visited: ' + error.message);
        }
    }

    function updateRemovedLandmarksList() {
        const container = document.getElementById('removedLandmarks');
        container.innerHTML = '';

        removedLandmarks.forEach((landmark, index) => {
            const item = document.createElement('div');
            item.className = 'plan-item removed';
            item.innerHTML = `
                <span>${landmark.name} (${landmark.position.lat}, ${landmark.position.lng})</span>
                <button class="btn btn-success btn-sm" onclick="restoreToPlan(${index})">Geri Ekle</button>
            `;
            container.appendChild(item);
        });
    }

    function restoreToPlan(index) {
        const restored = removedLandmarks.splice(index, 1)[0];
        selectedLandmarks.push(restored);
        updateSelectedLandmarksList();
        updateRemovedLandmarksList();
    }

    function removeLandmark(index) {
        // Remove marker from map
        map.removeLayer(markers[index]);
        // Remove marker from markers array
        markers.splice(index, 1);
        // Remove landmark from landmarks array
        landmarks.splice(index, 1);
        // Remove landmark from selectedLandmarks array
        selectedLandmarks.splice(index, 1);
        updateLandmarkList();
        updateSelectedLandmarksList();
    }

    function deselectLandmark(lat, lng) {
        const index = selectedLandmarks.findIndex(
            l => l.position.lat == lat && l.position.lng == lng
        );
        if (index !== -1) {
            selectedLandmarks.splice(index, 1);
            updateSelectedLandmarksList();
            updateLandmarkList();
        }
    }

    function selectLandmark(lat, lng) {
        // Find the landmark in the landmarks array
        const landmarkData = landmarks.find(l => l.latitude == lat && l.longitude == lng);
        
        // Zaten seçili mi kontrol et
        if (selectedLandmarks.some(l => l.position.lat == lat && l.position.lng == lng)) return;
        
        // Get the landmark name if available
        const name = landmarkData ? landmarkData.name || `Place ${selectedLandmarks.length + 1}` : `Place ${selectedLandmarks.length + 1}`;
        
        // Add to selected landmarks
        selectedLandmarks.push({
            position: { lat, lng },
            name: name,
            isVisited: landmarkData && landmarkData.id && visitedLandmarkIds.includes(landmarkData.id)
        });
        
        updateSelectedLandmarksList();
        updateLandmarkList();
    } 

    function removeLandmarkByLatLng(lat, lng) {
        // Get landmark info
        const index = landmarks.findIndex(l => l.latitude == lat && l.longitude == lng);
        if (index === -1) return;
            
        const landmarkToRemove = landmarks[index];
        const landmarkName = landmarkToRemove.name || 'Unnamed landmark';
        const landmarkId = landmarkToRemove.id;
            
        // Confirm deletion
        if (!confirm(`Are you sure you want to delete "${landmarkName}"? This will also delete all visit records for this landmark.`)) {
            return;
        }
        
        // First, immediately remove from UI to prevent duplicate delete attempts
        removeFromLocalArrays(index);
            
        // If landmark has an ID, delete from database
        if (landmarkId) {
            console.log('Starting deletion process for landmark ID:', landmarkId);
                
            // Use the existing endpoint with cascade=true to delete visited landmarks
            // This will delete both the landmark and its visited records in one request
            fetch(`/api/landmarks/${landmarkId}?cascade=true`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                console.log('Deletion response status:', response.status);
                if (!response.ok) {
                    throw new Error(`Failed to delete: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Deletion result:', data);
                const visitedCount = data.visitRecordsDeleted || 0;
                alert(`Successfully deleted "${landmarkName}" and ${visitedCount} associated visit records.`);
            })
            .catch(error => {
                console.error('Error during deletion process:', error);
                alert('Error while deleting: ' + error.message);
            });
        } else {
            // For landmarks without an ID (not saved to database), UI is already updated
            alert(`Deleted "${landmarkName}" from the map.`);
        }
    }
    
    // Helper function to remove landmark from local arrays and map
    function removeFromLocalArrays(index) {
        // Check if index is valid
        if (index < 0 || index >= landmarks.length) {
            console.warn(`Invalid index for landmark removal: ${index}`);
            return;
        }
        
        try {
            // Remove marker from map if it exists
            if (markers[index]) {
                map.removeLayer(markers[index]);
            } else {
                console.warn(`No marker found at index ${index}`);
            }
        } catch (error) {
            console.warn(`Error removing marker from map: ${error.message}`);
        }
        
        // Get removed landmark before splicing
        const removedLandmark = landmarks[index];
        
        // Remove from arrays (even if marker removal failed)
        if (index < markers.length) {
            markers.splice(index, 1);
        }
        landmarks.splice(index, 1);
            
        // selectedLandmarks'tan da çıkar
        if (removedLandmark) {
            const selectedIndex = selectedLandmarks.findIndex(l => 
                l.position.lat == removedLandmark.latitude && 
                l.position.lng == removedLandmark.longitude
            );
            if (selectedIndex !== -1) {
                selectedLandmarks.splice(selectedIndex, 1);
            }
                
            // Also remove from visitedLandmarkIds if it's there
            if (removedLandmark.id) {
                const visitedIndex = visitedLandmarkIds.indexOf(removedLandmark.id);
                if (visitedIndex !== -1) {
                    visitedLandmarkIds.splice(visitedIndex, 1);
                }
            }
        }
            
        updateLandmarkList();
        updateSelectedLandmarksList();
    }
    
    // Save notes for all selected landmarks
    async function saveLandmarkNotes() {
        // Get notes from the form
        const noteText = document.getElementById('landmarkNote').value;
        
        if (selectedLandmarks.length === 0) {
            alert('No landmarks selected!');
            return;
        }
        
        console.log(`Applying notes to ${selectedLandmarks.length} landmarks:`, noteText);
        
        // Keep track of success/failure
        let successCount = 0;
        let failureCount = 0;
        
        // Process each selected landmark
        const updatePromises = selectedLandmarks.map(async (selectedLandmark) => {
            try {
                // Find the corresponding landmark in landmarks array
                const landmarkData = landmarks.find(l => 
                    l.latitude == selectedLandmark.position.lat && 
                    l.longitude == selectedLandmark.position.lng
                );
                
                if (!landmarkData || !landmarkData.id) {
                    console.warn(`Landmark not found in database: ${selectedLandmark.name}`);
                    failureCount++;
                    return;
                }
                
                console.log(`Updating landmark with notes: ${landmarkData.id}`);
                
                // Update landmark in database
                const response = await fetch(`/api/landmarks/${landmarkData.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        notes: noteText
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to update landmark ${landmarkData.id}`);
                }
                
                const updatedLandmark = await response.json();
                console.log('Landmark updated:', updatedLandmark);
                
                // Update local landmark data
                landmarkData.notes = noteText;
                
                // Update marker popup to include notes
                const markerIndex = landmarks.findIndex(l => l.id === landmarkData.id);
                if (markerIndex !== -1 && markers[markerIndex]) {
                    const marker = markers[markerIndex];
                    const popupContent = `
                        <b>${landmarkData.name || 'Landmark'}</b><br>
                        ${landmarkData.description || ''}<br>
                        ${noteText ? `<p><strong>Notes:</strong> ${noteText}</p>` : ''}
                    `;
                    marker.setPopupContent(popupContent);
                }
                
                // Update the selected landmark with notes too
                selectedLandmark.notes = noteText;
                
                successCount++;
            } catch (error) {
                console.error(`Error updating landmark: ${error.message}`);
                failureCount++;
            }
        });
        
        // Wait for all updates to complete
        await Promise.all(updatePromises);
        
        // Update UI
        updateLandmarkList();
        
        // Show results
        if (failureCount === 0) {
            alert(`Notes successfully applied to all ${successCount} landmarks!`);
        } else {
            alert(`Notes applied to ${successCount} landmarks. Failed to update ${failureCount} landmarks.`);
        }
        
        // Close the modal
        bootstrap.Modal.getInstance(document.getElementById('addNotesModal')).hide();
    }
    
    // Function to load visited landmark IDs
    async function loadVisitedLandmarkIds() {
        try {
            console.log('Loading visited landmark IDs...');
            const response = await fetch('/api/visited');
            if (!response.ok) {
                throw new Error('Failed to fetch visited landmarks');
            }
            
            const visits = await response.json();
            console.log(`Found ${visits.length} visited landmarks`);
            
            // Extract unique landmark IDs from visits
            visitedLandmarkIds = Array.from(new Set(
                visits
                    .filter(visit => visit.landmark_id && visit.landmark_id._id) // Filter out null or invalid references
                    .map(visit => visit.landmark_id._id || visit.landmark_id)
            ));
            
            console.log('Visited landmark IDs:', visitedLandmarkIds);
            
            // Update the UI to reflect visited status
            updateLandmarkList();
        } catch (error) {
            console.error('Error loading visited landmark IDs:', error);
        }
    }
    
    // Search landmarks by name
    function searchLandmarks() {
        const searchTerm = document.getElementById('landmarkSearch').value.trim().toLowerCase();
        
        if (searchTerm === '' && !isFiltering) {
            // If search term is empty and no filters are active, show all landmarks
            filteredLandmarks = [];
            isFiltering = false;
            updateLandmarkList();
            return;
        }
        
        // Apply search and filters
        applyFilters(searchTerm);
    }

    // Clear search and filters
    function clearSearch() {
        // Reset search input
        document.getElementById('landmarkSearch').value = '';
        
        // Reset filters
        document.getElementById('filterCategory').value = '';
        document.getElementById('filterHasNotes').checked = false;
        document.getElementById('filterVisited').checked = false;
        
        // Show all landmarks
        filteredLandmarks = [];
        isFiltering = false;
        updateLandmarkList();
        
        // Focus map on all landmarks
        if (landmarks.length > 0) {
            const bounds = new L.LatLngBounds(
                landmarks.map(l => [parseFloat(l.latitude), parseFloat(l.longitude)])
            );
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }

    // Apply filters to landmarks
    function applyFilters(searchTerm) {
        // If called from an event, get the search term from the input
        if (typeof searchTerm !== 'string') {
            searchTerm = document.getElementById('landmarkSearch').value.trim().toLowerCase();
        }
        
        // Get filter values
        const categoryFilter = document.getElementById('filterCategory').value;
        const hasNotesFilter = document.getElementById('filterHasNotes').checked;
        const visitedFilter = document.getElementById('filterVisited').checked;
        
        // Check if any filters are active
        isFiltering = searchTerm !== '' || categoryFilter !== '' || hasNotesFilter || visitedFilter;
        
        if (!isFiltering) {
            filteredLandmarks = [];
            updateLandmarkList();
            return;
        }
        
        // Apply filters
        filteredLandmarks = landmarks.filter(landmark => {
            // If landmark has no data beyond coordinates, skip filters except name search
            if (!landmark.id && searchTerm === '') return false;
            
            // Search by name
            const nameMatch = !searchTerm || 
                (landmark.name && landmark.name.toLowerCase().includes(searchTerm));
            
            // Filter by category (skip if no category filter selected)
            const categoryMatch = !categoryFilter || 
                (landmark.category === categoryFilter);
            
            // Filter by has notes
            const hasNotesMatch = !hasNotesFilter || 
                (landmark.notes && landmark.notes.trim() !== '');
            
            // Filter by visited
            const visitedMatch = !visitedFilter || 
                (landmark.id && visitedLandmarkIds.includes(landmark.id));
            
            return nameMatch && categoryMatch && hasNotesMatch && visitedMatch;
        });
        
        // Update UI with filtered landmarks
        updateLandmarkList();
        
        // Focus map on filtered landmarks if there are any
        if (filteredLandmarks.length > 0) {
            const bounds = new L.LatLngBounds(
                filteredLandmarks.map(l => [parseFloat(l.latitude), parseFloat(l.longitude)])
            );
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }
    
    // Global variables for visited landmarks filtering
    let allVisits = []; // Store all visits
    let filteredVisits = []; // Store filtered visits
    let isVisitFiltering = false; // Flag to track if we're currently filtering visited landmarks

    // Search visited landmarks by name
    function searchVisitedLandmarks() {
        const searchTerm = document.getElementById('visitedLandmarkSearch').value.trim().toLowerCase();
        
        if (searchTerm === '' && !isVisitFiltering) {
            // If search term is empty and no filters are active, show all visited landmarks
            clearVisitedSearch();
            return;
        }
        
        // Apply search and filters
        applyVisitedFilters(searchTerm);
    }

    // Clear search and filters for visited landmarks
    function clearVisitedSearch() {
        // Reset search input
        document.getElementById('visitedLandmarkSearch').value = '';
        
        // Reset filters
        document.getElementById('visitedFilterCategory').value = '';
        document.getElementById('visitedFilterHasLandmarkNotes').checked = false;
        document.getElementById('visitedFilterHasVisitNotes').checked = false;
        document.getElementById('visitorNameFilter').value = '';
        
        // Reset filtering flag
        isVisitFiltering = false;
        
        // Hide results count indicator
        document.getElementById('visitedFilterResults').style.display = 'none';
        
        // Show all visited landmarks
        displayVisitedLandmarks(allVisits);
    }

    // Apply filters to visited landmarks
    function applyVisitedFilters(searchTerm) {
        // If no specific search term was passed, try to get it from the search input
        if (!searchTerm) {
            searchTerm = document.getElementById('visitedLandmarkSearch').value.trim().toLowerCase();
        }
        
        // Get filter values
        const categoryFilter = document.getElementById('visitedFilterCategory').value;
        const hasLandmarkNotesFilter = document.getElementById('visitedFilterHasLandmarkNotes').checked;
        const hasVisitNotesFilter = document.getElementById('visitedFilterHasVisitNotes').checked;
        const visitorNameFilter = document.getElementById('visitorNameFilter').value.trim().toLowerCase();
        
        // Check if any filters are active
        isVisitFiltering = searchTerm !== '' || 
                          categoryFilter !== '' || 
                          hasLandmarkNotesFilter || 
                          hasVisitNotesFilter ||
                          visitorNameFilter !== '';
        
        if (!isVisitFiltering) {
            clearVisitedSearch();
            return;
        }
        
        // Apply filters
        filteredVisits = allVisits.filter(visit => {
            // Skip if no landmark data
            if (!visit.landmark_id) return false;
            
            const landmark = visit.landmark_id;
            
            // Search by landmark name
            const nameMatch = !searchTerm || 
                (landmark.name && landmark.name.toLowerCase().includes(searchTerm));
            
            // Filter by category
            const categoryMatch = !categoryFilter || 
                (landmark.category === categoryFilter);
            
            // Filter by has landmark notes
            const hasLandmarkNotesMatch = !hasLandmarkNotesFilter || 
                (landmark.notes && landmark.notes.trim() !== '');
            
            // Filter by has visit notes
            // Check both potential locations for notes
            const visitNotes = visit.notes || visit.notesDirectAccess || '';
            const hasVisitNotesMatch = !hasVisitNotesFilter || 
                (visitNotes && visitNotes.trim() !== '');
            
            // Filter by visitor name
            const visitorName = visit.visitor_name || '';
            const visitorNameMatch = !visitorNameFilter || 
                visitorName.toLowerCase().includes(visitorNameFilter);
     
            return nameMatch && categoryMatch && hasLandmarkNotesMatch && hasVisitNotesMatch && visitorNameMatch;
        });
        
        // Display filtered visits
        displayVisitedLandmarks(filteredVisits);
        
        // Show filter results info
        const resultsDiv = document.getElementById('visitedFilterResults');
        resultsDiv.style.display = 'block';
        resultsDiv.textContent = `Showing ${filteredVisits.length} of ${allVisits.length} visited landmarks`;
    }

    // Function to display visited landmarks (all or filtered)
    function displayVisitedLandmarks(visitsToDisplay) {
        const listContainer = document.getElementById('visitedLandmarksList');
        listContainer.innerHTML = '';
        
        if (visitsToDisplay.length === 0) {
            if (isVisitFiltering) {
                listContainer.innerHTML = `<div class="alert alert-warning">No visited landmarks match your search or filter criteria.</div>`;
            } else {
                listContainer.innerHTML = `<div class="alert alert-info">No visited landmarks yet.</div>`;
            }
            return;
        }
        
        // Display each visited landmark
        visitsToDisplay.forEach((visit, index) => {
            if (!visit.landmark_id) {
                console.warn('Visit has no landmark_id:', visit);
                return;
            }
            
            const item = document.createElement('div');
            item.className = 'list-group-item mb-3';
            
            // Format the date
            const visitDate = new Date(visit.visited_date);
            const formattedDate = visitDate.toLocaleDateString() + ' ' + 
                                 visitDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            // Get landmark details
            const landmark = visit.landmark_id;
            
            // Get visitor name (with fallback)
            const visitorName = visit.visitor_name || 'Anonymous';
            
            // Try to find notes at different possible locations
            const visitNotes = visit.notes || visit.notesDirectAccess || '';
            
            // Add category badge if available
            const categoryBadge = landmark.category 
                ? `<span class="badge bg-info me-2">${landmark.category}</span>` 
                : '';
                
            // Add indicators for landmark notes and visit notes
            const hasLandmarkNotes = landmark.notes && landmark.notes.trim() !== '';
            const hasVisitNotes = visitNotes && visitNotes.trim() !== '';
            
            const notesBadges = `
                ${hasLandmarkNotes ? '<span class="badge bg-success me-2">Has Landmark Notes</span>' : ''}
                ${hasVisitNotes ? '<span class="badge bg-primary">Has Visit Notes</span>' : ''}
            `;
            
            item.innerHTML = `
                <div class="visited-landmark">
                    <div class="d-flex justify-content-between mb-2">
                        <h5>${landmark.name || 'Unnamed Landmark'}</h5>
                        <div>
                            ${categoryBadge}
                            ${notesBadges}
                        </div>
                    </div>
                    <p class="location">Location: ${landmark.location.latitude}, ${landmark.location.longitude}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <p class="visit-date">Visited on: ${formattedDate}</p>
                        <p class="visitor-name"><strong>Visited by:</strong> ${visitorName}</p>
                    </div>
                    ${landmark.description ? `<p class="description"><strong>Description:</strong> ${landmark.description}</p>` : ''}
                    ${hasLandmarkNotes ? `<div class="landmark-notes">${landmark.notes}</div>` : ''}
                    ${hasVisitNotes ? `<div class="visit-notes">${visitNotes}</div>` : ''}
                </div>
            `;
            
            listContainer.appendChild(item);
        });
    }
    
    // Function to open edit landmark modal
    function editLandmark(lat, lng) {
        // Find the landmark in the landmarks array
        const landmark = landmarks.find(l => l.latitude == lat && l.longitude == lng);
        
        if (!landmark || !landmark.id) {
            alert('Cannot edit this landmark. It may not be saved to the database.');
            return;
        }
        
        // Populate form with landmark data
        document.getElementById('editLandmarkId').value = landmark.id;
        document.getElementById('editLandmarkName').value = landmark.name || '';
        document.getElementById('editLandmarkDescription').value = landmark.description || '';
        document.getElementById('editLandmarkCategory').value = landmark.category || 'historical';
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('editLandmarkModal'));
        modal.show();
    }
    
    // Function to save edited landmark
    async function saveEditedLandmark() {
        // Get values from form
        const landmarkId = document.getElementById('editLandmarkId').value;
        const name = document.getElementById('editLandmarkName').value;
        const description = document.getElementById('editLandmarkDescription').value;
        const category = document.getElementById('editLandmarkCategory').value;
        
        // Validate form
        if (!name || !description || !category) {
            alert('Please fill in all fields');
            return;
        }
        
        try {
            console.log(`Updating landmark with ID: ${landmarkId}`);
            
            // Send update request to API
            const response = await fetch(`/api/landmarks/${landmarkId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    description,
                    category
                })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to update landmark: ${response.status} ${response.statusText}`);
            }
            
            const updatedLandmark = await response.json();
            console.log('Landmark updated successfully:', updatedLandmark);
            
            // Update landmark in local array
            const landmarkIndex = landmarks.findIndex(l => l.id === landmarkId);
            if (landmarkIndex !== -1) {
                landmarks[landmarkIndex].name = name;
                landmarks[landmarkIndex].description = description;
                landmarks[landmarkIndex].category = category;
                
                // Update popup content
                if (markers[landmarkIndex]) {
                    const popupContent = `
                        <b>${name}</b><br>
                        ${description}<br>
                        ${landmarks[landmarkIndex].notes ? `<p><strong>Notes:</strong> ${landmarks[landmarkIndex].notes}</p>` : ''}
                    `;
                    markers[landmarkIndex].setPopupContent(popupContent);
                }
                
                // Update in selectedLandmarks if it's there
                const selectedIndex = selectedLandmarks.findIndex(l => 
                    l.position.lat == landmarks[landmarkIndex].latitude && 
                    l.position.lng == landmarks[landmarkIndex].longitude
                );
                if (selectedIndex !== -1) {
                    selectedLandmarks[selectedIndex].name = name;
                }
            }
            
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('editLandmarkModal')).hide();
            
            // Update UI
            updateLandmarkList();
            updateSelectedLandmarksList();
            
            alert('Landmark updated successfully!');
            
        } catch (error) {
            console.error('Error updating landmark:', error);
            alert(`Error updating landmark: ${error.message}`);
        }
    }
    
