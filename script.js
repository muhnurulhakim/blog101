let allPosts = [];
const postsPerPage = 5;
let currentPage = 1;

async function loadAllPosts() {
    try {
        const response = await fetch('posts/posts.json');
        if (!response.ok) {
            throw new Error('Failed to load post list.');
        }
        const posts = await response.json();
        allPosts = await Promise.all(posts.map(loadPostData));
        displayPosts();
        setupPagination();
    } catch (error) {
        console.error('Error loading posts:', error);
        document.getElementById('posts').innerHTML = '<p>Error loading posts. Please try again later.</p>';
    }
}

async function loadPostData(file) {
    try {
        const response = await fetch(`posts/${file}`);
        if (!response.ok) {
            throw new Error(`File ${file} not found or can't be loaded.`);
        }
        const data = await response.text();
        const metadataMatch = data.match(/---\n([\s\S]+?)\n---/);
        if (!metadataMatch) {
            throw new Error('Metadata not found in the markdown file.');
        }
        const metadata = metadataMatch[1];
        const content = data.replace(/---\n[\s\S]+?\n---/, '');
        const titleMatch = metadata.match(/title: "(.*)"/);
        const dateMatch = metadata.match(/date: (.*)/);
        if (!titleMatch || !dateMatch) {
            throw new Error('Title or date not found in the metadata.');
        }
        return {
            title: titleMatch[1],
            date: new Date(dateMatch[1]),
            content: content,
            file: file
        };
    } catch (error) {
        console.error(`Error loading post ${file}:`, error);
        return null;
    }
}

function displayPosts(posts = allPosts) {
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const postsToDisplay = posts.slice(startIndex, endIndex);

    const postsContainer = document.getElementById('posts');
    postsContainer.innerHTML = '';

    postsToDisplay.forEach(post => {
        if (post) {
            const postElement = document.createElement('div');
            postElement.className = 'post';
            const formattedDate = post.date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
            const previewContent = post.content.split(' ').slice(0, 20).join(' ') + '...';
            postElement.innerHTML = `
                <h2><a href="post.html?file=${post.file}" class="post-title">${post.title}</a></h2>
                <p class="post-date">${formattedDate}</p>
                <div class="post-content">${marked(previewContent)}</div>
                <a href="post.html?file=${post.file}" class="read-more">Baca Selengkapnya</a>
            `;
            postsContainer.appendChild(postElement);
        }
    });
}

function setupPagination() {
    const totalPages = Math.ceil(allPosts.length / postsPerPage);
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.innerText = i;
        button.classList.add('pagination-button');
        if (i === currentPage) {
            button.disabled = true;
        }
        button.addEventListener('click', () => {
            currentPage = i;
            displayPosts();
            setupPagination();
        });
        paginationContainer.appendChild(button);
    }
}

function loadSinglePost() {
    const urlParams = new URLSearchParams(window.location.search);
    const file = urlParams.get('file');
    if (file) {
        loadPostData(file).then(post => {
            if (post) {
                const postContainer = document.getElementById('post');
                const formattedDate = post.date.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                });
                postContainer.innerHTML = `
                    <h1>${post.title}</h1>
                    <p class="post-date">${formattedDate}</p>
                    <div class="post-content">${marked(post.content)}</div>
                `;
            } else {
                document.getElementById('post').innerHTML = '<p>Error loading post. Please try again later.</p>';
            }
        });
    } else {
        document.getElementById('post').innerHTML = '<p>No post specified.</p>';
    }
}

function setupSearch() {
    const searchToggle = document.getElementById('searchToggle');
    const searchContainer = document.getElementById('searchContainer');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');

    searchToggle.addEventListener('click', (e) => {
        e.preventDefault();
        searchContainer.style.display = searchContainer.style.display === 'none' ? 'block' : 'none';
    });

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredPosts = allPosts.filter(post => 
        post.title.toLowerCase().includes(searchTerm) || 
        post.content.toLowerCase().includes(searchTerm)
    );
    currentPage = 1;
    displayPosts(filteredPosts);
    setupPagination();
}

window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('posts')) {
        loadAllPosts();
        setupSearch();
    } else if (document.getElementById('post')) {
        loadSinglePost();
    }
});
