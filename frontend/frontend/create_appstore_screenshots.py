#!/usr/bin/env python3
"""
Create professional App Store screenshots with iPhone frames and marketing text
"""

from PIL import Image, ImageDraw, ImageFont
import os

# App Store required dimensions for iPhone 6.7" (iPhone 14 Pro Max)
TARGET_WIDTH = 1290
TARGET_HEIGHT = 2796

# Colors
BACKGROUND_COLOR = (18, 18, 18)  # Dark background matching app
ACCENT_COLOR = (0, 210, 190)  # Teal/cyan accent color
TEXT_COLOR = (255, 255, 255)  # White text

# Marketing texts for each screenshot (French)
MARKETING_TEXTS_FR = [
    ("Bienvenue chez\nInvasion Latina", "La plus grande soirée latino\nde Belgique"),
    ("Événements\n& Actualités", "Restez informé des\nprochaines soirées"),
    ("Nos DJs\nRésidents", "Reggaeton • Dembow\nLatin House"),
    ("Réservation\nde Tables", "Main Room • Classy Room\nVIP"),
    ("Achetez vos\nBillets", "Paiement sécurisé\nvia XCEED"),
    ("Invasion Coins", "Gagnez des points\nEntrées gratuites"),
]

def create_screenshot_with_frame(input_path, output_path, title, subtitle, index):
    """Create a professional App Store screenshot"""
    
    # Create base image with dark background
    final_img = Image.new('RGB', (TARGET_WIDTH, TARGET_HEIGHT), BACKGROUND_COLOR)
    draw = ImageDraw.Draw(final_img)
    
    # Load and resize the screenshot
    try:
        screenshot = Image.open(input_path)
        
        # Calculate dimensions for the phone screen area
        phone_width = int(TARGET_WIDTH * 0.85)
        phone_height = int(phone_width * (screenshot.height / screenshot.width))
        
        # Resize screenshot
        screenshot = screenshot.resize((phone_width, phone_height), Image.Resampling.LANCZOS)
        
        # Position: centered horizontally, lower part of the image
        x_pos = (TARGET_WIDTH - phone_width) // 2
        y_pos = TARGET_HEIGHT - phone_height - 100  # 100px from bottom
        
        # Add rounded corners effect (simple version - paste the image)
        final_img.paste(screenshot, (x_pos, y_pos))
        
        # Draw a border around the screenshot (phone frame effect)
        border_color = (60, 60, 60)
        border_width = 8
        draw.rectangle(
            [x_pos - border_width, y_pos - border_width, 
             x_pos + phone_width + border_width, y_pos + phone_height + border_width],
            outline=border_color, width=border_width
        )
        
    except Exception as e:
        print(f"Error loading screenshot: {e}")
    
    # Add marketing text at the top
    # Use a basic font (system default)
    try:
        # Try to use a bold font if available
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 90)
        subtitle_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 50)
    except:
        title_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
    
    # Draw title (centered)
    title_y = 150
    for i, line in enumerate(title.split('\n')):
        bbox = draw.textbbox((0, 0), line, font=title_font)
        text_width = bbox[2] - bbox[0]
        x = (TARGET_WIDTH - text_width) // 2
        draw.text((x, title_y + i * 110), line, font=title_font, fill=TEXT_COLOR)
    
    # Draw subtitle (centered, below title)
    subtitle_y = title_y + len(title.split('\n')) * 110 + 50
    for i, line in enumerate(subtitle.split('\n')):
        bbox = draw.textbbox((0, 0), line, font=subtitle_font)
        text_width = bbox[2] - bbox[0]
        x = (TARGET_WIDTH - text_width) // 2
        draw.text((x, subtitle_y + i * 65), line, font=subtitle_font, fill=ACCENT_COLOR)
    
    # Save the final image
    final_img.save(output_path, 'PNG', quality=95)
    print(f"✅ Created: {output_path}")

def main():
    input_dir = "/app/appstore_screenshots"
    output_dir = "/app/appstore_final"
    
    os.makedirs(output_dir, exist_ok=True)
    
    screenshots = [
        ("01_welcome.png", "01_welcome_final.png"),
        ("02_home.png", "02_home_final.png"),
        ("03_djs.png", "03_djs_final.png"),
        ("04_booking.png", "04_booking_final.png"),
        ("05_tickets.png", "05_tickets_final.png"),
        ("06_profile.png", "06_profile_final.png"),
    ]
    
    for i, (input_file, output_file) in enumerate(screenshots):
        input_path = os.path.join(input_dir, input_file)
        output_path = os.path.join(output_dir, output_file)
        
        if os.path.exists(input_path):
            title, subtitle = MARKETING_TEXTS_FR[i]
            create_screenshot_with_frame(input_path, output_path, title, subtitle, i)
        else:
            print(f"⚠️ File not found: {input_path}")
    
    print(f"\n🎉 All screenshots created in {output_dir}")
    print(f"📱 Dimensions: {TARGET_WIDTH} x {TARGET_HEIGHT} (iPhone 6.7\")")

if __name__ == "__main__":
    main()
