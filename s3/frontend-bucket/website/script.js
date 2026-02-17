const fileInput = document.getElementById('file-input');
const addFilesBtn = document.getElementById('add-files-btn');
const mergeBtn = document.getElementById('merge-btn');
const fileList = document.getElementById('file-list');
const spinner = document.getElementById('spinner');
const spinnerWrapper = document.getElementById('spinner-wrapper');
const statusMessage = document.getElementById('status-message');

const API_BASE_URL = ''; // Add before deploying
const PRESIGN_ENDPOINT = `${API_BASE_URL}/generate-presigned-urls`;
const MERGE_ENDPOINT   = `${API_BASE_URL}/merge-pdf`;

let selectedFiles = [];

// Open file picker
addFilesBtn.addEventListener('click', () => fileInput.click());

// Handle file selection
fileInput.addEventListener('change', (event) => {
    const files = Array.from(event.target.files);

    files.forEach(file => {
        if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
            selectedFiles.push(file);
        }
    });

    updateFileList();
    fileInput.value = '';
});

function updateFileList() {
    fileList.innerHTML = '';

    if (selectedFiles.length === 0) {
        mergeBtn.disabled = true;
        statusMessage.textContent = 'Select files to begin.';
        return;
    }

    selectedFiles.forEach((file, index) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <i class="fas fa-file-pdf"></i> ${file.name}
            <span class="remove-file" data-index="${index}">❌</span>
        `;
        fileList.appendChild(listItem);
    });

    // Only enable merge when 2+ files selected
    mergeBtn.disabled = selectedFiles.length < 2;

    const count = selectedFiles.length;

    // Better UX messages
    if (count === 1) {
        statusMessage.textContent = `Select at least 2 files to merge`;
    } else {
        statusMessage.textContent = `${count} files selected`;
    }

    // Remove file handler
    document.querySelectorAll('.remove-file').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = e.target.getAttribute('data-index');
            selectedFiles.splice(idx, 1);
            updateFileList();
        });
    });
}

mergeBtn.addEventListener('click', async () => {
    if (selectedFiles.length < 2) return; // Safety guard

    addFilesBtn.disabled = true;
    mergeBtn.disabled = true;
    spinnerWrapper.classList.remove('hidden');
    spinner.classList.add('fa-spin');

    try {
        await handleMergeProcess();
    } catch (err) {
        statusMessage.textContent = err.message || 'Something went wrong. Please try again.';
    }  finally {
        spinnerWrapper.classList.add('hidden');
        spinner.classList.remove('fa-spin');
        addFilesBtn.disabled = false;
        mergeBtn.disabled = selectedFiles.length < 2;
    }
});

async function handleMergeProcess() {

    statusMessage.textContent = 'Generating upload URLs...';

    // Get presigned URLs
    const response = await fetch(PRESIGN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filenames: selectedFiles.map(f => f.name) })
    });

    if (!response.ok) throw new Error('Failed to get upload URLs');

    const presignedData = await response.json();

    statusMessage.textContent = 'Uploading files...';
    const uploadedKeys = [];

    // Upload PDFs to presigned URLs
    for (let file of selectedFiles) {
        const { key, upload_url } = presignedData[file.name];
        uploadedKeys.push(key);

        const uploadResponse = await fetch(upload_url, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': 'application/pdf' }
        });

        if (!uploadResponse.ok) throw new Error(`File upload failed`);
    }

    // Request merge
    statusMessage.textContent = 'Merging PDFs...';

    const mergeResponse = await fetch(MERGE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: uploadedKeys })
    });

    if (!mergeResponse.ok) throw new Error('Merge failed');

    const result = await mergeResponse.json();

    statusMessage.textContent = 'Merged PDF download starting...';

    // Download merged PDF
    const link = document.createElement('a');
    link.href = result.merged_pdf_url;
    link.download = 'merged.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();

    // Reset
    selectedFiles = [];
    updateFileList();
}


// Init
mergeBtn.disabled = true;
statusMessage.textContent = 'Select files to begin.';
