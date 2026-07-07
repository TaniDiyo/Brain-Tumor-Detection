document.addEventListener('DOMContentLoaded', async () => {
    // Check if data exists
    const dataStr = sessionStorage.getItem('tumorData');
    if (!dataStr) {
        window.location.href = '/';
        return;
    }

    const data = JSON.parse(dataStr);
    
    // DOM Elements
    const tumorType = document.getElementById('tumor-type');
    const confidenceValue = document.getElementById('confidence-value');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const resultIconContainer = document.getElementById('result-icon-container');
    const resultIcon = resultIconContainer.querySelector('i');
    
    const analysisSection = document.getElementById('analysis-section');
    const tumorDescription = document.getElementById('tumor-description');
    const performanceAnalysis = document.getElementById('performance-analysis');
    const backBtn = document.getElementById('back-btn');

    // Display basic info
    const { formatted_class, class: raw_class, confidence, description, performance_analysis, all_probabilities } = data;

    tumorType.textContent = formatted_class;
    tumorDescription.textContent = description;
    performanceAnalysis.textContent = performance_analysis;

    // Confidence animation
    let startTimestamp = null;
    const duration = 1000;
    
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentVal = Math.floor(progress * confidence);
        confidenceValue.textContent = currentVal + '%';
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            confidenceValue.textContent = confidence + '%';
        }
    };
    window.requestAnimationFrame(step);

    // Progress bar animation
    setTimeout(() => {
        progressBarFill.style.width = confidence + '%';
    }, 100);

    // Styling
    if (raw_class === 'no_tumor') {
        resultIconContainer.style.background = 'rgba(16, 185, 129, 0.1)';
        resultIcon.className = 'fa-solid fa-heart-circle-check';
        resultIcon.style.color = 'var(--secondary-color)';
        progressBarFill.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
        analysisSection.classList.add('no-tumor-style');
        analysisSection.classList.remove('tumor-style');
    } else {
        resultIconContainer.style.background = 'rgba(239, 68, 68, 0.1)';
        resultIcon.className = 'fa-solid fa-virus';
        resultIcon.style.color = 'var(--error-color)';
        progressBarFill.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
        analysisSection.classList.add('tumor-style');
        analysisSection.classList.remove('no-tumor-style');
    }

    // Performance Chart
    const ctx = document.getElementById('performanceChart').getContext('2d');
    const chartLabels = Object.keys(all_probabilities);
    const chartData = Object.values(all_probabilities);
    const highlightColor = raw_class === 'no_tumor' ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)';
    const highlightBorder = raw_class === 'no_tumor' ? 'rgba(16, 185, 129, 1)' : 'rgba(239, 68, 68, 1)';
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Confidence (%)',
                data: chartData,
                backgroundColor: chartLabels.map(label => label === formatted_class ? highlightColor : 'rgba(203, 213, 225, 0.5)'),
                borderColor: chartLabels.map(label => label === formatted_class ? highlightBorder : 'rgba(203, 213, 225, 1)'),
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { callback: function(value) { return value + '%'; } }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: function(context) { return context.parsed.y + '%'; } } }
            }
        }
    });

    // Load Metrics Charts
    try {
        const response = await fetch('/history');
        const historyData = await response.json();
        
        if (response.ok) {
            const epochs = Array.from({length: historyData.accuracy.length}, (_, i) => `Epoch ${i+1}`);
            
            // Accuracy Chart
            const ctxAcc = document.getElementById('accuracyChart').getContext('2d');
            new Chart(ctxAcc, {
                type: 'line',
                data: {
                    labels: epochs,
                    datasets: [
                        {
                            label: 'Training Accuracy',
                            data: historyData.accuracy.map(x => x * 100),
                            borderColor: 'rgba(14, 165, 233, 1)',
                            backgroundColor: 'rgba(14, 165, 233, 0.1)',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Validation Accuracy',
                            data: historyData.val_accuracy.map(x => x * 100),
                            borderColor: 'rgba(16, 185, 129, 1)',
                            backgroundColor: 'transparent',
                            borderDash: [5, 5],
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { title: { display: true, text: 'Model Accuracy', font: { size: 16 } } },
                    scales: { y: { title: { display: true, text: 'Accuracy (%)' } } }
                }
            });

            // Loss Chart
            const ctxLoss = document.getElementById('lossChart').getContext('2d');
            new Chart(ctxLoss, {
                type: 'line',
                data: {
                    labels: epochs,
                    datasets: [
                        {
                            label: 'Training Loss',
                            data: historyData.loss,
                            borderColor: 'rgba(239, 68, 68, 1)',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Validation Loss',
                            data: historyData.val_loss,
                            borderColor: 'rgba(245, 158, 11, 1)',
                            backgroundColor: 'transparent',
                            borderDash: [5, 5],
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { title: { display: true, text: 'Model Loss', font: { size: 16 } } },
                    scales: { y: { title: { display: true, text: 'Loss' } } }
                }
            });
        }
    } catch (e) {
        console.error("Failed to load history metrics", e);
    }

    backBtn.addEventListener('click', () => {
        window.location.href = '/';
    });
});
