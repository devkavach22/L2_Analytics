import matplotlib.pyplot as plt
import os
import uuid

def generate_chart(data: dict):
    """
    Creates a chart image from JSON data.
    Expected format: {"title": "Revenue 2024", "labels": ["Jan", "Feb"], "values": [100, 200]}
    """
    if not data or not data.get("values") or len(data["values"]) == 0:
        return None

    try:
        # Create output directory
        output_dir = "static/charts"
        os.makedirs(output_dir, exist_ok=True)
        
        # Setup Figure
        plt.figure(figsize=(10, 5))
        
        labels = data.get("labels", [])
        values = [float(v) for v in data.get("values", [])] # Ensure numbers
        title = data.get("title", "Data Analysis")

        # Create Bar Chart
        bars = plt.bar(labels, values, color='#4A90E2', zorder=3)
        
        # Styling
        plt.title(title, fontsize=14, fontweight='bold')
        plt.grid(axis='y', linestyle='--', alpha=0.7, zorder=0)
        plt.ylabel("Values")
        
        # Add values on top of bars
        for bar in bars:
            height = bar.get_height()
            plt.text(bar.get_x() + bar.get_width()/2., height,
                     f'{height}', ha='center', va='bottom')

        # Save Image
        filename = f"chart_{uuid.uuid4().hex[:8]}.png"
        filepath = os.path.join(output_dir, filename)
        
        plt.savefig(filepath, bbox_inches='tight')
        plt.close()
        
        print(f"✔ Chart generated: {filepath}")
        return filepath

    except Exception as e:
        print(f"❌ Chart Generation Error: {e}")
        return None