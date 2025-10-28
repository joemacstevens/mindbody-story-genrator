# STUDIOGRAM REDESIGN - IMPLEMENTATION GUIDE
## Detailed Prompts for Step-by-Step Development

---

## OVERVIEW

This guide provides detailed implementation prompts in a logical build order. Each section can be given to an agent as a standalone task. Dependencies are noted where relevant.

**Tech Stack Assumptions:**
- Frontend framework (React/Vue/Svelte or similar)
- CSS/Tailwind for styling
- Modern JavaScript/TypeScript

**Reference Files:**
- `studiogram-gym-finder.html` - Main gym finder
- `studiogram-gym-empty-state.html` - Empty state variant
- `studiogram-gym-manual-entry.html` - Manual entry flow
- `studiogram-editor-desktop.html` - Desktop editor layout
- `studiogram-animation-timeline.html` - Animation specifications

---

## PHASE 1: FOUNDATION & DESIGN SYSTEM

### Prompt 1.1: Create Design Tokens

**Task:** Set up the core design system variables and tokens for the entire application.

**Requirements:**
Create a design tokens file (CSS variables, JavaScript constants, or Tailwind config) with the following:

**Colors:**
```
Primary Colors:
- Primary: #8B7BD8
- Primary Dark: #6B5BB8
- Primary Light: #A78BFA

Background Colors:
- Background Deep: #0F172A
- Background: #1E293B
- Surface: rgba(255, 255, 255, 0.05)
- Surface Hover: rgba(255, 255, 255, 0.08)

Text Colors:
- Text Primary: #F8FAFC
- Text Secondary: #CBD5E1
- Text Tertiary: #94A3B8
- Text Muted: #64748B
- Text Disabled: #475569

Accent Colors:
- Accent Coral: #FF6B6B
- Accent Sage: #84A98C
- Accent Green: #10B981
- Accent Red: #EF4444

Borders:
- Border Light: rgba(255, 255, 255, 0.1)
- Border Medium: rgba(255, 255, 255, 0.15)
- Border Primary: rgba(139, 123, 216, 0.3)
```

**Typography:**
```
Font Family:
- Primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif
- Mono: 'Monaco', 'Courier New', monospace

Font Sizes:
- xs: 11px
- sm: 13px
- base: 14px
- md: 15px
- lg: 16px
- xl: 18px
- 2xl: 20px
- 3xl: 24px
- 4xl: 32px
- 5xl: 42px

Font Weights:
- normal: 400
- medium: 500
- semibold: 600
- bold: 700
```

**Spacing Scale:**
```
1: 4px
2: 8px
3: 12px
4: 16px
5: 20px
6: 24px
7: 28px
8: 32px
10: 40px
12: 48px
16: 64px
```

**Border Radius:**
```
sm: 6px
md: 8px
lg: 10px
xl: 12px
2xl: 16px
3xl: 20px
full: 9999px
```

**Shadows:**
```
sm: 0 2px 4px rgba(0, 0, 0, 0.2)
md: 0 4px 12px rgba(0, 0, 0, 0.2)
lg: 0 8px 24px rgba(0, 0, 0, 0.3)
xl: 0 20px 60px rgba(0, 0, 0, 0.3)
primary: 0 4px 16px rgba(139, 123, 216, 0.3)
```

**Animation Durations:**
```
fast: 150ms
base: 200ms
moderate: 300ms
slow: 400ms
slower: 600ms
```

**Easing Functions:**
```
easeOut: cubic-bezier(0.25, 0.46, 0.45, 0.94)
easeIn: cubic-bezier(0.55, 0.085, 0.68, 0.53)
easeInOut: cubic-bezier(0.4, 0, 0.2, 1)
spring: cubic-bezier(0.34, 1.56, 0.64, 1)
smoothDecel: cubic-bezier(0.16, 1, 0.3, 1)
```

**Deliverable:** A tokens file that can be imported throughout the application.

---

### Prompt 1.2: Create Base Component Library

**Task:** Build reusable base components that will be used throughout the app.

**Dependencies:** Requires Prompt 1.1 (Design Tokens)

**Components to Build:**

**1. Button Component**
```
Variants:
- primary: Gradient background (#8B7BD8 to #6B5BB8)
- secondary: Surface with border
- ghost: Transparent with hover

Sizes:
- sm: 10px 16px padding, 14px font
- md: 12px 20px padding, 15px font
- lg: 14px 24px padding, 16px font

States:
- default
- hover (translateY(-2px) for primary)
- active (translateY(0))
- disabled (opacity: 0.5, no interactions)

Props:
- variant: 'primary' | 'secondary' | 'ghost'
- size: 'sm' | 'md' | 'lg'
- disabled: boolean
- loading: boolean (shows spinner)
- icon: ReactNode (optional icon before text)
- onClick: function
```

**2. Input Component**
```
Variants:
- text
- search (with search icon)
- url

States:
- default: border rgba(255,255,255,0.1)
- focus: border #8B7BD8, box-shadow glow
- filled: border rgba(139,123,216,0.5)
- error: border #EF4444

Props:
- type: string
- placeholder: string
- value: string
- onChange: function
- icon: ReactNode (optional left icon)
- error: string (error message)
- helpText: string
```

**3. Toggle Switch**
```
States:
- off: background rgba(255,255,255,0.1)
- on: background #8B7BD8

Animation:
- Background color: 300ms ease
- Thumb position: 300ms cubic-bezier(0.4, 0, 0.2, 1)
- Thumb size: 18px, translateX(18px) when on

Props:
- checked: boolean
- onChange: function
- disabled: boolean
```

**4. Card Component**
```
Default Style:
- background: rgba(255,255,255,0.05)
- backdrop-filter: blur(20px)
- border: 1px solid rgba(255,255,255,0.1)
- border-radius: 20px
- padding: 40px

Variants:
- default
- interactive (hover effects)
- elevated (larger shadow)

Props:
- variant: string
- children: ReactNode
```

**5. Badge Component**
```
Variants:
- primary: rgba(139,123,216,0.15) bg, #A78BFA text
- success: rgba(16,185,129,0.15) bg, #34D399 text
- info: rgba(100,116,139,0.2) bg, #64748B text

Props:
- variant: string
- icon: ReactNode
- children: ReactNode
```

**Deliverable:** Component library file with all 5 components, fully typed and documented.

---

## PHASE 2: GYM FINDER SCREENS

### Prompt 2.1: Build Main Gym Finder (With Saved Gyms)

**Task:** Create the main gym finder screen that users see when they have saved gyms.

**Dependencies:** Requires 1.1 (Design Tokens) and 1.2 (Base Components)

**Reference:** `studiogram-gym-finder.html`

**Layout Structure:**
```
<Container>
  <BackgroundGradients />
  <Header>
    <Logo />
    <ProfileButton />
  </Header>
  <MainContent>
    <Hero>
      <Badge>Quick Setup</Badge>
      <Title>Find Your Gym</Title>
      <Subtitle>Connect to your Mindbody studio...</Subtitle>
    </Hero>
    <Card>
      <SearchSection />
      <Divider />
      <SavedGymsSection />
    </Card>
  </MainContent>
</Container>
```

**Component Requirements:**

**1. BackgroundGradients Component:**
- Two absolute positioned divs with radial gradients
- Gradient 1: 600px circle, rgba(139,123,216,0.15), top-right
- Gradient 2: 500px circle, rgba(99,102,241,0.1), bottom-left
- Both animate with pulse (scale 1-1.1 over 8-10s)

**2. Header Component:**
- Sticky position, backdrop-filter: blur(20px)
- Logo with icon + text on left
- Profile button on right (40px circle with initials)

**3. Hero Component:**
- Badge: Small pill with icon + "Quick Setup"
- Title: 42px, gradient text effect
- Subtitle: 17px, muted color
- Center aligned

**4. SearchSection Component:**
- Label: "Search for your gym"
- Input with search icon on left (🔍)
- Placeholder: "Enter gym name..."
- Help text: "Use the official name from Mindbody"
- SearchResults dropdown (absolute positioned)

**5. SearchResults Component:**
- Appears below input when typing (query.length >= 2)
- Dropdown animation: translateY(-10px) → 0, opacity 0 → 1, 300ms
- Each result shows: gym name, location, optional "verified" badge
- Hover state: background rgba(139,123,216,0.1)
- Click triggers gym selection

**6. Divider Component:**
- Horizontal line with centered text "or choose from saved"
- Gradient lines on both sides

**7. SavedGymsSection Component:**
- Section header with "Recent Gyms" title + "View All" button
- List of 3 gym items (card style)
- Each gym shows: icon (emoji), name, "Last used X days ago"
- Hover: translateX(4px), border glow
- Arrow on right side

**State Management:**
```javascript
const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState([]);
const [showResults, setShowResults] = useState(false);
const [savedGyms, setSavedGyms] = useState([
  { id: 1, name: 'Humble Yoga', icon: '🧘', lastUsed: '2 days ago' },
  // ... more gyms
]);
```

**Search Logic:**
- Debounce: 300ms after last keystroke
- Only search if query.length >= 2
- Mock API call or use provided gym data
- Show "No results" with link to manual entry if empty

**Animations:**
Entry animations (stagger on mount):
- Badge: 200ms delay, slideUp + fade
- Title: 300ms delay, slideUp + fade
- Subtitle: 400ms delay, slideUp + fade
- Card: 500ms delay, slideUp + fade

**Deliverable:** Complete gym finder component with search functionality, saved gyms list, and all animations working.

---

### Prompt 2.2: Build Empty State Gym Finder

**Task:** Create the gym finder variant for new users with no saved gyms.

**Dependencies:** Requires 2.1 (Main Gym Finder - reuse components)

**Reference:** `studiogram-gym-empty-state.html`

**Changes from Main Finder:**

**1. Hero Badge:**
- Change from "⚡ Quick Setup" to "👋 Welcome"
- Update subtitle to be more welcoming: "Let's get you set up! Search for your studio to sync your class schedule."

**2. Replace SavedGymsSection with EmptyState Component:**
```
<EmptyState>
  <Illustration>
    <FloatingEmoji>🏋️</FloatingEmoji>
  </Illustration>
  <Title>No saved gyms yet</Title>
  <Description>Start by searching above...</Description>
  <CTABox>
    <Icon>📌</Icon>
    <Title>Can't find your gym?</Title>
    <Description>Add it manually with your Mindbody URL</Description>
    <Button onClick={navigateToManualEntry}>
      Add Manually →
    </Button>
  </CTABox>
  <FeatureList>
    <Feature icon="⚡" title="Instant Sync" />
    <Feature icon="🎨" title="Custom Designs" />
    <Feature icon="📱" title="Share Anywhere" />
  </FeatureList>
</EmptyState>
```

**EmptyState Styling:**
- Center aligned
- Padding: 48px 20px
- Floating emoji: animate up/down 10px over 3s

**CTABox Styling:**
- Background: rgba(139,123,216,0.1)
- Border: rgba(139,123,216,0.2)
- Padding: 24px
- Button: Full width, secondary style

**Feature Items:**
- Display: flex, icon on left (32px circle)
- Title: 14px semibold
- Description: 13px muted
- Hover: background rgba(255,255,255,0.04)

**Logic:**
```javascript
// Conditionally render based on saved gyms
{savedGyms.length === 0 ? (
  <EmptyState />
) : (
  <SavedGymsSection gyms={savedGyms} />
)}
```

**Deliverable:** Empty state variant that seamlessly switches with main finder based on data.

---

### Prompt 2.3: Build Manual Entry Flow

**Task:** Create the manual gym entry form for users who can't find their gym.

**Dependencies:** Requires 1.2 (Base Components)

**Reference:** `studiogram-gym-manual-entry.html`

**Route:** `/gym/add-manually`

**Layout Structure:**
```
<Container>
  <BackgroundGradients />
  <Header>
    <Logo />
    <BackButton onClick={goBack}>← Back</BackButton>
  </Header>
  <MainContent>
    <Hero>
      <Icon>✏️</Icon>
      <Title>Add Your Gym Manually</Title>
      <Subtitle>We'll need your Mindbody schedule URL...</Subtitle>
    </Hero>
    <Card>
      <StepsIndicator currentStep={1} totalSteps={2} />
      <FormContent />
    </Card>
  </MainContent>
</Container>
```

**Component Requirements:**

**1. StepsIndicator Component:**
```
Display: flex, centered
Each step: 4px height bar
Active step: 48px width, primary color
Inactive step: 32px width, rgba(255,255,255,0.1)
Transition: all 300ms
```

**2. InfoBox Component:**
- Background: rgba(139,123,216,0.1)
- Border: rgba(139,123,216,0.2)
- Icon: 💡 in circle
- Title: "Where to find your schedule URL"
- Text: Instructions on finding URL
- Border-radius: 12px, padding: 16px

**3. FormContent Component:**
```
<form onSubmit={handleSubmit}>
  <InfoBox />
  
  <FormGroup>
    <Label>Gym Name <Required>*</Required></Label>
    <Input 
      type="text"
      placeholder="e.g., Humble Yoga"
      value={gymName}
      onChange={setGymName}
    />
    <HelpText>This is just for your reference</HelpText>
  </FormGroup>

  <FormGroup>
    <Label>Mindbody Schedule URL <Required>*</Required></Label>
    <Input 
      type="url"
      placeholder="https://clients.mindbodyonline.com/..."
      value={gymUrl}
      onChange={setGymUrl}
      error={urlError}
    />
    <HelpText>
      Need help? <Link>Watch a quick tutorial</Link>
    </HelpText>
    <ExampleCard>
      <ExampleTitle>Example URL:</ExampleTitle>
      <ExampleUrl>https://clients.mindbody...123456</ExampleUrl>
    </ExampleCard>
  </FormGroup>

  <ButtonGroup>
    <Button variant="secondary" onClick={goBack}>
      Cancel
    </Button>
    <Button 
      variant="primary" 
      type="submit"
      disabled={!isValid}
      loading={isSubmitting}
    >
      Continue →
    </Button>
  </ButtonGroup>
</form>
```

**Validation Logic:**
```javascript
const [gymName, setGymName] = useState('');
const [gymUrl, setGymUrl] = useState('');
const [urlError, setUrlError] = useState('');
const [isSubmitting, setIsSubmitting] = useState(false);

// Real-time validation
const isValid = useMemo(() => {
  return gymName.trim().length > 0 && 
         gymUrl.includes('mindbody');
}, [gymName, gymUrl]);

// URL validation on blur
const validateUrl = () => {
  if (gymUrl && !gymUrl.includes('mindbody')) {
    setUrlError('Please enter a valid Mindbody URL');
    // Show red border for 2s then fade
    setTimeout(() => setUrlError(''), 2000);
  }
};

// Submit handler
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!isValid) return;
  
  setIsSubmitting(true);
  
  try {
    // API call to save gym
    await saveGym({ name: gymName, url: gymUrl });
    
    // Update step indicator
    setCurrentStep(2);
    
    // Show success state
    showSuccessMessage();
    
    // Navigate to editor after 2.5s
    setTimeout(() => {
      navigate('/editor');
    }, 2500);
  } catch (error) {
    setUrlError(error.message);
    setIsSubmitting(false);
  }
};
```

**4. SuccessMessage Component:**
```
<SuccessMessage>
  <SuccessIcon>✓</SuccessIcon>
  <Title>Gym Added!</Title>
  <Text>We're syncing your schedule now...</Text>
  <Button>Go to Editor →</Button>
</SuccessMessage>
```

**Success Animation:**
- Icon: scale 0 → 1 with bounce (cubic-bezier(0.34, 1.56, 0.64, 1))
- Duration: 600ms
- Auto-navigate after 2.5s

**Deliverable:** Complete manual entry flow with validation, success state, and navigation.

---

## PHASE 3: EDITOR LAYOUT & STRUCTURE

### Prompt 3.1: Build Desktop Editor Layout

**Task:** Create the main editor layout structure with canvas and right panel.

**Dependencies:** Requires 1.1 and 1.2

**Reference:** `studiogram-editor-desktop.html`

**Layout Structure:**
```
<EditorContainer>
  <Header />
  <MainLayout>
    <CanvasArea />
    <RightPanel />
  </MainLayout>
</EditorContainer>
```

**Component Requirements:**

**1. Header Component:**
```
<Header>
  <Left>
    <Logo />
    <Breadcrumb>
      <Link>Templates</Link>
      <Separator>/</Separator>
      <Current>Schedule Editor</Current>
    </Breadcrumb>
  </Left>
  
  <Center>
    <GymSelector>
      📍 {gymName} ▾
    </GymSelector>
  </Center>
  
  <Right>
    <Button variant="secondary">↻ Reset</Button>
    <Button variant="primary">💾 Save Template</Button>
    <ProfileButton />
  </Right>
</Header>
```

Styling:
- Height: 72px
- Sticky top: 0
- Backdrop-filter: blur(20px)
- Background: rgba(15,23,42,0.95)

**2. MainLayout Component:**
```
display: grid
grid-template-columns: 1fr 420px
height: calc(100vh - 72px)
overflow: hidden
```

**3. CanvasArea Component:**
```
<CanvasArea>
  <CanvasBackground /> {/* Gradient + grid */}
  
  <PreviewControls>
    <ZoomControls>
      <Button>−</Button>
      <Span>100%</Span>
      <Button>+</Button>
      <Button>⊡</Button> {/* Fit to screen */}
    </ZoomControls>
    
    <DeviceToggle>
      <Button active>📱 Mobile</Button>
      <Button>📱 Tablet</Button>
      <Button>🖥️ Desktop</Button>
    </DeviceToggle>
  </PreviewControls>
  
  <PreviewWrapper>
    <PreviewFrame device={selectedDevice}>
      <SchedulePreview />
    </PreviewFrame>
  </PreviewWrapper>
</CanvasArea>
```

**CanvasBackground:**
```
Position: absolute, inset: 0
Gradients: Two radial gradients (similar to gym finder)
Grid: 
  background-image: 
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
  background-size: 40px 40px
  opacity: 0.5
```

**PreviewFrame:**
```
Sizes based on device prop:
- mobile: 375px × 667px
- tablet: 768px × 1024px
- desktop: 1200px × 800px

Styling:
- background: linear-gradient(135deg, #1E293B, #0F172A)
- border-radius: 24px (mobile/tablet), 12px (desktop)
- border: 3px solid rgba(255,255,255,0.15)
- box-shadow: 0 30px 90px rgba(0,0,0,0.5)
- transition: all 400ms cubic-bezier(0.4, 0, 0.2, 1)

Animation:
- Float: translateY(0) ↔ translateY(-10px) over 6s
```

**4. RightPanel Component:**
```
<RightPanel>
  <ResizeHandle /> {/* Draggable edge */}
  <TabNavigation />
  <PanelContent />
</RightPanel>
```

Styling:
- Width: 420px (default), resizable 320-600px
- Background: rgba(15,23,42,0.95)
- Backdrop-filter: blur(20px)
- Border-left: 1px solid rgba(255,255,255,0.1)

**5. ResizeHandle Component:**
```
Position: absolute, left: 0
Width: 4px
Height: 100%
Cursor: ew-resize
Background: transparent (primary on hover/drag)

Drag Logic:
- On mousedown: set dragging state
- On mousemove: calculate new width
- Constrain: 320px ≤ width ≤ 600px
- On mouseup: clear dragging state
```

**6. TabNavigation Component:**
```
<TabNav>
  <Tab active={activeTab === 'style'} onClick={() => setActiveTab('style')}>
    Style
  </Tab>
  <Tab active={activeTab === 'content'}>
    Content
  </Tab>
  <Tab active={activeTab === 'layout'}>
    Layout
  </Tab>
</TabNav>
```

Styling:
- Background: rgba(255,255,255,0.03)
- Padding: 6px
- Border-radius: 10px
- Gap: 4px
- Active tab: rgba(139,123,216,0.15), color #8B7BD8

**State Management:**
```javascript
const [selectedDevice, setSelectedDevice] = useState('mobile');
const [zoomLevel, setZoomLevel] = useState(100);
const [activeTab, setActiveTab] = useState('style');
const [panelWidth, setPanelWidth] = useState(420);
```

**Deliverable:** Complete editor layout with resizable panel, device switching, and tab navigation (content comes in next prompts).

---

### Prompt 3.2: Build Schedule Preview Component

**Task:** Create the live preview component that shows the schedule design.

**Dependencies:** Requires 3.1 (Editor Layout)

**Component Structure:**
```
<SchedulePreview>
  {scheduleItems.map((item, index) => (
    <ScheduleItem 
      key={item.id}
      item={item}
      style={currentStyles}
      animationDelay={index * 100}
    />
  ))}
</SchedulePreview>
```

**ScheduleItem Component:**
```
<ScheduleItem 
  cornerRadius={styles.cornerRadius}
  spacing={styles.spacing}
  dividerStyle={styles.dividerStyle}
>
  {visibleElements.includes('time') && (
    <Time color={styles.timeColor} fontSize={styles.timeFontSize}>
      {item.time}
    </Time>
  )}
  
  {visibleElements.includes('className') && (
    <ClassName color={styles.classColor} fontSize={styles.classFontSize}>
      {item.className}
    </ClassName>
  )}
  
  {visibleElements.includes('instructor') && (
    <Instructor color={styles.instructorColor} fontSize={styles.instructorFontSize}>
      {item.instructor}
    </Instructor>
  )}
  
  {visibleElements.includes('location') && (
    <Location>{item.location}</Location>
  )}
</ScheduleItem>
```

**Default Styles State:**
```javascript
const [styles, setStyles] = useState({
  // Colors
  backgroundColor: '#1E293B',
  timeColor: '#8B7BD8',
  classColor: '#F8FAFC',
  instructorColor: '#94A3B8',
  
  // Typography
  timeFontSize: 14,
  classFontSize: 16,
  instructorFontSize: 13,
  
  // Layout
  cornerRadius: 12,
  spacing: 'comfortable', // compact | comfortable | spacious
  dividerStyle: 'thin', // none | thin | thick | dotted
  accentLines: true,
  footerBar: false,
  
  // Background
  backgroundImage: null,
  
  // Logo
  logo: null,
  logoPosition: 'top', // top | center | bottom
});

const [visibleElements, setVisibleElements] = useState([
  'time',
  'className',
  'instructor',
  'location'
]);

const [elementOrder, setElementOrder] = useState([
  'time',
  'className',
  'instructor',
  'location'
]);
```

**Mock Schedule Data:**
```javascript
const scheduleItems = [
  {
    id: 1,
    time: '9:00 AM',
    className: 'Vinyasa Flow',
    instructor: 'with Sarah Chen',
    location: 'Studio A',
    duration: '60 min'
  },
  {
    id: 2,
    time: '10:30 AM',
    className: 'Power Yoga',
    instructor: 'with Michael Torres',
    location: 'Studio B',
    duration: '45 min'
  },
  {
    id: 3,
    time: '12:00 PM',
    className: 'Gentle Restorative',
    instructor: 'with Emma Williams',
    location: 'Studio A',
    duration: '75 min'
  }
];
```

**Entrance Animation:**
```css
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.schedule-item {
  animation: slideInUp 500ms ease-out forwards;
  animation-delay: calc(var(--index) * 100ms);
  opacity: 0;
}
```

**Real-time Updates:**
When styles change, immediately update preview (no delay needed):
```javascript
const updateStyle = (key, value) => {
  setStyles(prev => ({
    ...prev,
    [key]: value
  }));
  // Preview updates automatically via re-render
};
```

**Deliverable:** Working schedule preview that responds to style changes in real-time.

---

## PHASE 4: EDITOR PANELS (STYLE TAB)

### Prompt 4.1: Build Style Tab - Color Palettes

**Task:** Create the color palette selector in the Style tab.

**Dependencies:** Requires 3.1 (Editor Layout) and 3.2 (Preview)

**Component Structure:**
```
<StyleTab>
  <Section title="Color Theme">
    <PaletteGrid>
      {palettes.map(palette => (
        <PaletteCard 
          key={palette.id}
          palette={palette}
          selected={selectedPalette === palette.id}
          onClick={() => selectPalette(palette)}
        />
      ))}
    </PaletteGrid>
    <Button variant="secondary" fullWidth>
      🎨 Customize Colors
    </Button>
  </Section>
</StyleTab>
```

**Palette Data:**
```javascript
const colorPalettes = [
  {
    id: 'studio-slate',
    name: 'Studio Slate',
    colors: {
      primary: '#334155',
      background: '#F8FAFC',
      accent: '#FF6B6B'
    },
    preview: ['#334155', '#F8FAFC', '#FF6B6B']
  },
  {
    id: 'serene-studio',
    name: 'Serene Studio',
    colors: {
      primary: '#475569',
      background: '#FFF8F0',
      accent: '#84A98C'
    },
    preview: ['#475569', '#FFF8F0', '#84A98C']
  },
  {
    id: 'modern-wellness',
    name: 'Modern Wellness',
    colors: {
      primary: '#2D3748',
      background: '#E8DCC8',
      accent: '#2F4F4F'
    },
    preview: ['#2D3748', '#E8DCC8', '#2F4F4F']
  },
  {
    id: 'sunset-minimal',
    name: 'Sunset Minimal',
    colors: {
      primary: '#4A3F5C',
      background: '#FFF5E1',
      accent: '#C8A882'
    },
    preview: ['#4A3F5C', '#FFF5E1', '#C8A882']
  }
];
```

**PaletteCard Component:**
```
<PaletteCard 
  selected={isSelected}
  onClick={handleClick}
>
  <PaletteName>{palette.name}</PaletteName>
  <PaletteColors>
    {palette.preview.map(color => (
      <ColorSwatch key={color} color={color} />
    ))}
  </PaletteColors>
</PaletteCard>
```

**Styling:**
```css
.palette-card {
  background: rgba(255,255,255,0.04);
  border: 1.5px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  padding: 14px;
  cursor: pointer;
  transition: all 200ms ease-out;
}

.palette-card:hover {
  border-color: rgba(139,123,216,0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.palette-card.selected {
  border-color: #8B7BD8;
  background: rgba(139,123,216,0.08);
  box-shadow: 0 0 0 3px rgba(139,123,216,0.1);
}

.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 5px;
  border: 1px solid rgba(255,255,255,0.15);
}
```

**Selection Logic:**
```javascript
const [selectedPalette, setSelectedPalette] = useState('studio-slate');

const selectPalette = (palette) => {
  setSelectedPalette(palette.id);
  
  // Update preview styles
  updateStyle('timeColor', palette.colors.accent);
  updateStyle('backgroundColor', palette.colors.background);
  // ... apply other palette colors
  
  // Smooth color transition in preview (300ms)
};
```

**"Customize Colors" Button:**
Opens a color picker modal (can be built in a later phase, for now just show placeholder).

**Deliverable:** Working color palette selector that updates preview in real-time.

---

### Prompt 4.2: Build Style Tab - Background & Logo

**Task:** Create background and logo upload sections in Style tab.

**Dependencies:** Requires 4.1

**Component Structure:**
```
<Section title="Background">
  <ImageUploadArea 
    onUpload={handleBackgroundUpload}
    currentImage={styles.backgroundImage}
  >
    {!styles.backgroundImage ? (
      <>
        <UploadIcon>🖼️</UploadIcon>
        <UploadText>
          Tap to upload image
          <br />
          <span>or use solid color</span>
        </UploadText>
      </>
    ) : (
      <ImagePreview src={styles.backgroundImage} />
    )}
  </ImageUploadArea>
  
  {styles.backgroundImage && (
    <Button 
      variant="secondary" 
      fullWidth
      onClick={removeBackground}
    >
      🗑️ Remove Background
    </Button>
  )}
</Section>

<Section title="Logo">
  <ImageUploadArea 
    onUpload={handleLogoUpload}
    currentImage={styles.logo}
  >
    {!styles.logo ? (
      <>
        <UploadIcon>📌</UploadIcon>
        <UploadText>Upload your logo</UploadText>
      </>
    ) : (
      <ImagePreview src={styles.logo} />
    )}
  </ImageUploadArea>
  
  {styles.logo && (
    <ControlGroup>
      <ControlLabel>Position</ControlLabel>
      <RadioGroup>
        <RadioOption 
          selected={styles.logoPosition === 'top'}
          onClick={() => updateStyle('logoPosition', 'top')}
        >
          Top
        </RadioOption>
        <RadioOption 
          selected={styles.logoPosition === 'center'}
          onClick={() => updateStyle('logoPosition', 'center')}
        >
          Center
        </RadioOption>
        <RadioOption 
          selected={styles.logoPosition === 'bottom'}
          onClick={() => updateStyle('logoPosition', 'bottom')}
        >
          Bottom
        </RadioOption>
      </RadioGroup>
    </ControlGroup>
  )}
</Section>
```

**ImageUploadArea Component:**
```jsx
const ImageUploadArea = ({ onUpload, currentImage, children }) => {
  const fileInputRef = useRef(null);
  
  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }
      
      // Create object URL for preview
      const imageUrl = URL.createObjectURL(file);
      onUpload(imageUrl, file);
    }
  };
  
  return (
    <>
      <div 
        className="image-upload-area"
        onClick={handleClick}
      >
        {children}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </>
  );
};
```

**Styling:**
```css
.image-upload-area {
  background: rgba(255,255,255,0.03);
  border: 1.5px dashed rgba(255,255,255,0.2);
  border-radius: 10px;
  padding: 28px;
  text-align: center;
  cursor: pointer;
  transition: all 200ms;
  margin-bottom: 12px;
}

.image-upload-area:hover {
  border-color: #8B7BD8;
  background: rgba(139,123,216,0.05);
}

.upload-icon {
  font-size: 28px;
  margin-bottom: 8px;
  opacity: 0.5;
}

.image-preview {
  max-width: 100%;
  max-height: 120px;
  border-radius: 8px;
  object-fit: contain;
}
```

**RadioGroup Component:**
```jsx
const RadioGroup = ({ children }) => (
  <div className="radio-group">
    {children}
  </div>
);

const RadioOption = ({ selected, onClick, children }) => (
  <button
    className={`radio-option ${selected ? 'selected' : ''}`}
    onClick={onClick}
  >
    {children}
  </button>
);
```

**RadioOption Styling:**
```css
.radio-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 6px;
}

.radio-option {
  background: rgba(255,255,255,0.04);
  border: 1.5px solid rgba(255,255,255,0.1);
  border-radius: 7px;
  padding: 10px;
  text-align: center;
  cursor: pointer;
  transition: all 200ms;
  font-size: 13px;
  color: #94A3B8;
}

.radio-option:hover {
  border-color: rgba(139,123,216,0.4);
  color: #CBD5E1;
}

.radio-option.selected {
  border-color: #8B7BD8;
  background: rgba(139,123,216,0.15);
  color: #8B7BD8;
}
```

**Upload Handlers:**
```javascript
const handleBackgroundUpload = (imageUrl, file) => {
  updateStyle('backgroundImage', imageUrl);
  // In production: upload to cloud storage
};

const handleLogoUpload = (imageUrl, file) => {
  updateStyle('logo', imageUrl);
  // In production: upload to cloud storage
};

const removeBackground = () => {
  updateStyle('backgroundImage', null);
};
```

**Deliverable:** Working background and logo upload sections with preview updates.

---

## PHASE 5: EDITOR PANELS (CONTENT TAB)

### Prompt 5.1: Build Content Tab - Element List

**Task:** Create the draggable element list in the Content tab.

**Dependencies:** Requires 3.1 and 3.2

**Reference:** Look at Content tab in `studiogram-editor-desktop.html`

**Component Structure:**
```
<ContentTab>
  <Section 
    title="Schedule Elements"
    badge="💡 Drag to reorder"
  >
    <ElementList>
      {visibleElements.map((elementId, index) => (
        <ElementItem
          key={elementId}
          elementId={elementId}
          element={elements[elementId]}
          visible={true}
          index={index}
          onReorder={handleReorder}
        />
      ))}
    </ElementList>
    
    <HiddenElements>
      <HiddenLabel>Hidden Elements</HiddenLabel>
      <ElementList>
        {hiddenElements.map((elementId) => (
          <ElementItem
            key={elementId}
            elementId={elementId}
            element={elements[elementId]}
            visible={false}
            onToggle={handleToggle}
          />
        ))}
      </ElementList>
    </HiddenElements>
  </Section>
</ContentTab>
```

**Element Data Structure:**
```javascript
const elements = {
  time: {
    id: 'time',
    label: 'Time',
    defaultFontSize: 14,
    defaultColor: '#8B7BD8'
  },
  className: {
    id: 'className',
    label: 'Class Name',
    defaultFontSize: 16,
    defaultColor: '#F8FAFC'
  },
  instructor: {
    id: 'instructor',
    label: 'Instructor',
    defaultFontSize: 13,
    defaultColor: '#94A3B8'
  },
  location: {
    id: 'location',
    label: 'Room/Location',
    defaultFontSize: 13,
    defaultColor: '#94A3B8'
  },
  duration: {
    id: 'duration',
    label: 'Duration',
    defaultFontSize: 12,
    defaultColor: '#64748B'
  },
  description: {
    id: 'description',
    label: 'Description',
    defaultFontSize: 12,
    defaultColor: '#64748B'
  }
};

const [visibleElements, setVisibleElements] = useState([
  'className',
  'instructor',
  'time',
  'location'
]);

const [hiddenElements, setHiddenElements] = useState([
  'duration',
  'description'
]);

const [elementStyles, setElementStyles] = useState({
  time: { fontSize: 14, color: '#8B7BD8', fontWeight: 600 },
  className: { fontSize: 16, color: '#F8FAFC', fontWeight: 500 },
  // ... etc
});
```

**ElementItem Component:**
```jsx
const ElementItem = ({ 
  elementId, 
  element, 
  visible, 
  index,
  onReorder 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  
  return (
    <div
      className={`element-item ${!visible ? 'hidden' : ''} ${isDragging ? 'dragging' : ''}`}
      draggable={visible}
      onDragStart={(e) => handleDragStart(e, index)}
      onDragEnd={() => setIsDragging(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => handleDrop(e, index)}
    >
      <DragHandle visible={visible}>☰</DragHandle>
      
      <ElementLabel>{element.label}</ElementLabel>
      
      <ElementActions>
        <IconButton 
          title="Font settings"
          onClick={() => openFontModal(elementId)}
        >
          Aa
        </IconButton>
        
        <IconButton 
          title="Color"
          onClick={() => openColorPicker(elementId)}
        >
          🎨
        </IconButton>
        
        <ToggleSwitch
          checked={visible}
          onChange={() => toggleElementVisibility(elementId)}
        />
      </ElementActions>
    </div>
  );
};
```

**Drag & Drop Logic:**
```javascript
let draggedIndex = null;

const handleDragStart = (e, index) => {
  draggedIndex = index;
  setIsDragging(true);
  e.dataTransfer.effectAllowed = 'move';
};

const handleDrop = (e, dropIndex) => {
  e.preventDefault();
  
  if (draggedIndex === null || draggedIndex === dropIndex) {
    return;
  }
  
  // Reorder array
  const newOrder = [...visibleElements];
  const [draggedItem] = newOrder.splice(draggedIndex, 1);
  newOrder.splice(dropIndex, 0, draggedItem);
  
  setVisibleElements(newOrder);
  setIsDragging(false);
  draggedIndex = null;
};

const toggleElementVisibility = (elementId) => {
  if (visibleElements.includes(elementId)) {
    // Move to hidden
    setVisibleElements(prev => prev.filter(id => id !== elementId));
    setHiddenElements(prev => [...prev, elementId]);
  } else {
    // Move to visible
    setHiddenElements(prev => prev.filter(id => id !== elementId));
    setVisibleElements(prev => [...prev, elementId]);
  }
};
```

**Styling:**
```css
.element-item {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: move;
  transition: all 200ms ease-out;
  margin-bottom: 8px;
}

.element-item:hover {
  background: rgba(255,255,255,0.07);
  border-color: rgba(255,255,255,0.15);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.element-item.dragging {
  opacity: 0.4;
  transform: scale(0.98);
}

.element-item.hidden {
  opacity: 0.5;
}

.drag-handle {
  color: #475569;
  font-size: 16px;
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

.element-label {
  flex: 1;
  font-size: 14px;
  color: #CBD5E1;
}

.element-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

.hidden-elements {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255,255,255,0.08);
}

.hidden-label {
  font-size: 11px;
  color: #475569;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

**IconButton Component:**
```jsx
const IconButton = ({ onClick, title, children }) => (
  <button
    className="icon-btn"
    onClick={onClick}
    title={title}
  >
    {children}
  </button>
);
```

**IconButton Styling:**
```css
.icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 5px;
  background: rgba(255,255,255,0.05);
  border: none;
  color: #64748B;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 200ms;
  font-size: 14px;
}

.icon-btn:hover {
  background: rgba(139,123,216,0.2);
  color: #8B7BD8;
}
```

**Deliverable:** Working element list with drag-and-drop reordering and visibility toggles.

---

### Prompt 5.2: Build Font Settings Modal

**Task:** Create a modal for editing individual element typography.

**Dependencies:** Requires 5.1

**Modal Trigger:** Clicking the "Aa" icon button on any element.

**Component Structure:**
```jsx
<Modal
  isOpen={fontModalOpen}
  onClose={() => setFontModalOpen(false)}
  title={`Font Settings - ${elements[activeElement]?.label}`}
>
  <FontSettings
    elementId={activeElement}
    currentStyles={elementStyles[activeElement]}
    onUpdate={(styles) => updateElementStyles(activeElement, styles)}
  />
</Modal>
```

**FontSettings Component:**
```jsx
const FontSettings = ({ elementId, currentStyles, onUpdate }) => {
  const [fontSize, setFontSize] = useState(currentStyles.fontSize);
  const [fontWeight, setFontWeight] = useState(currentStyles.fontWeight);
  const [letterSpacing, setLetterSpacing] = useState(currentStyles.letterSpacing || 0);
  const [lineHeight, setLineHeight] = useState(currentStyles.lineHeight || 1.5);
  
  useEffect(() => {
    // Live preview update
    onUpdate({
      fontSize,
      fontWeight,
      letterSpacing,
      lineHeight
    });
  }, [fontSize, fontWeight, letterSpacing, lineHeight]);
  
  return (
    <div className="font-settings">
      <ControlGroup>
        <ControlLabel>
          <span>Font Size</span>
          <span className="control-value">{fontSize}px</span>
        </ControlLabel>
        <Slider
          min={10}
          max={32}
          value={fontSize}
          onChange={setFontSize}
        />
      </ControlGroup>
      
      <ControlGroup>
        <ControlLabel>Font Weight</ControlLabel>
        <RadioGroup>
          <RadioOption 
            selected={fontWeight === 400}
            onClick={() => setFontWeight(400)}
          >
            Normal
          </RadioOption>
          <RadioOption 
            selected={fontWeight === 500}
            onClick={() => setFontWeight(500)}
          >
            Medium
          </RadioOption>
          <RadioOption 
            selected={fontWeight === 600}
            onClick={() => setFontWeight(600)}
          >
            Semibold
          </RadioOption>
          <RadioOption 
            selected={fontWeight === 700}
            onClick={() => setFontWeight(700)}
          >
            Bold
          </RadioOption>
        </RadioGroup>
      </ControlGroup>
      
      <ControlGroup>
        <ControlLabel>
          <span>Letter Spacing</span>
          <span className="control-value">{letterSpacing}px</span>
        </ControlLabel>
        <Slider
          min={-2}
          max={4}
          step={0.5}
          value={letterSpacing}
          onChange={setLetterSpacing}
        />
      </ControlGroup>
      
      <ControlGroup>
        <ControlLabel>
          <span>Line Height</span>
          <span className="control-value">{lineHeight}</span>
        </ControlLabel>
        <Slider
          min={1}
          max={2.5}
          step={0.1}
          value={lineHeight}
          onChange={setLineHeight}
        />
      </ControlGroup>
      
      <ButtonGroup>
        <Button variant="secondary" onClick={resetToDefault}>
          Reset
        </Button>
        <Button variant="primary" onClick={closeModal}>
          Done
        </Button>
      </ButtonGroup>
    </div>
  );
};
```

**Modal Component (Base):**
```jsx
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        <ModalBody>
          {children}
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};
```

**Modal Styling:**
```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 200ms ease-out;
}

.modal-content {
  background: #1E293B;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 16px;
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  animation: slideUp 300ms ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #F8FAFC;
}

.close-button {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255,255,255,0.05);
  border: none;
  color: #94A3B8;
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
  transition: all 200ms;
}

.close-button:hover {
  background: rgba(255,255,255,0.1);
  color: #F8FAFC;
}

.modal-body {
  padding: 24px;
}
```

**Slider Component:**
```jsx
const Slider = ({ min, max, step = 1, value, onChange }) => {
  return (
    <input
      type="range"
      className="slider"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
};
```

**Slider Styling:**
```css
.slider {
  width: 100%;
  height: 5px;
  border-radius: 2.5px;
  background: rgba(255,255,255,0.1);
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #8B7BD8;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(139,123,216,0.4);
  transition: all 200ms;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 3px 10px rgba(139,123,216,0.5);
}

.slider::-webkit-slider-thumb:active {
  transform: scale(1.05);
}
```

**Deliverable:** Working font settings modal with live preview updates.

---

### Prompt 5.3: Build Color Picker Modal

**Task:** Create a color picker modal for individual elements.

**Dependencies:** Requires 5.1 and 5.2 (Modal component)

**Modal Trigger:** Clicking the "🎨" icon button on any element.

**Component Structure:**
```jsx
<Modal
  isOpen={colorModalOpen}
  onClose={() => setColorModalOpen(false)}
  title={`Color - ${elements[activeElement]?.label}`}
>
  <ColorPicker
    elementId={activeElement}
    currentColor={elementStyles[activeElement]?.color}
    onUpdate={(color) => updateElementColor(activeElement, color)}
  />
</Modal>
```

**ColorPicker Component:**
```jsx
const ColorPicker = ({ elementId, currentColor, onUpdate }) => {
  const [color, setColor] = useState(currentColor);
  
  // Preset colors
  const presetColors = [
    '#8B7BD8', '#A78BFA', '#6B5BB8', // Purples
    '#F8FAFC', '#CBD5E1', '#94A3B8', // Grays
    '#FF6B6B', '#EF4444', '#DC2626', // Reds
    '#10B981', '#34D399', '#6EE7B7', // Greens
    '#3B82F6', '#60A5FA', '#93C5FD', // Blues
    '#F59E0B', '#FBBF24', '#FCD34D', // Yellows
  ];
  
  useEffect(() => {
    onUpdate(color);
  }, [color]);
  
  return (
    <div className="color-picker">
      {/* Color Preview */}
      <ColorPreview>
        <PreviewSwatch color={color} />
        <PreviewLabel>Current Color</PreviewLabel>
        <PreviewHex>{color.toUpperCase()}</PreviewHex>
      </ColorPreview>
      
      {/* Preset Colors */}
      <Section title="Quick Colors">
        <ColorGrid>
          {presetColors.map(presetColor => (
            <ColorSwatch
              key={presetColor}
              color={presetColor}
              selected={color === presetColor}
              onClick={() => setColor(presetColor)}
            />
          ))}
        </ColorGrid>
      </Section>
      
      {/* Custom Color Input */}
      <Section title="Custom Color">
        <InputGroup>
          <ColorInput
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
          <TextInput
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            pattern="^#[0-9A-Fa-f]{6}$"
          />
        </InputGroup>
      </Section>
      
      <ButtonGroup>
        <Button variant="secondary" onClick={resetToDefault}>
          Reset
        </Button>
        <Button variant="primary" onClick={closeModal}>
          Done
        </Button>
      </ButtonGroup>
    </div>
  );
};
```

**Styling:**
```css
.color-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  background: rgba(255,255,255,0.03);
  border-radius: 12px;
  margin-bottom: 24px;
}

.preview-swatch {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  border: 2px solid rgba(255,255,255,0.2);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  margin-bottom: 12px;
}

.preview-label {
  font-size: 12px;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.preview-hex {
  font-size: 16px;
  font-weight: 600;
  color: #CBD5E1;
  font-family: Monaco, monospace;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.color-swatch {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  border: 2px solid rgba(255,255,255,0.15);
  cursor: pointer;
  transition: all 200ms;
  position: relative;
}

.color-swatch:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.color-swatch.selected {
  border-color: #F8FAFC;
  box-shadow: 0 0 0 2px rgba(248,250,252,0.3);
}

.color-swatch.selected::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 16px;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
}

.input-group {
  display: flex;
  gap: 12px;
}

.color-input {
  width: 60px;
  height: 48px;
  border: 2px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  cursor: pointer;
  background: transparent;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-input::-webkit-color-swatch {
  border: none;
  border-radius: 6px;
}

.text-input {
  flex: 1;
  padding: 12px 16px;
  background: rgba(255,255,255,0.05);
  border: 2px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  font-size: 14px;
  color: #F8FAFC;
  font-family: Monaco, monospace;
}

.text-input:focus {
  border-color: #8B7BD8;
  box-shadow: 0 0 0 3px rgba(139,123,216,0.1);
  outline: none;
}
```

**Validation:**
```javascript
const isValidHex = (color) => {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
};

const handleTextInput = (e) => {
  const value = e.target.value;
  if (isValidHex(value)) {
    setColor(value);
  }
};
```

**Deliverable:** Working color picker modal with presets, custom input, and live preview.

---

## PHASE 6: EDITOR PANELS (LAYOUT TAB)

### Prompt 6.1: Build Layout Tab - All Controls

**Task:** Create all layout controls in the Layout tab.

**Dependencies:** Requires 3.1, 3.2, and slider/radio components from previous prompts

**Component Structure:**
```jsx
<LayoutTab>
  <Section>
    {/* Corner Radius */}
    <ControlGroup>
      <ControlLabel>
        <span>Corner Radius</span>
        <span className="control-value">{styles.cornerRadius}px</span>
      </ControlLabel>
      <Slider
        min={0}
        max={40}
        value={styles.cornerRadius}
        onChange={(value) => updateStyle('cornerRadius', value)}
      />
    </ControlGroup>

    {/* Spacing */}
    <ControlGroup>
      <ControlLabel>
        <span>Spacing & Density</span>
        <span className="control-value">{styles.spacing}</span>
      </ControlLabel>
      <RadioGroup>
        <RadioOption 
          selected={styles.spacing === 'compact'}
          onClick={() => updateStyle('spacing', 'compact')}
        >
          Compact
        </RadioOption>
        <RadioOption 
          selected={styles.spacing === 'comfortable'}
          onClick={() => updateStyle('spacing', 'comfortable')}
        >
          Comfortable
        </RadioOption>
        <RadioOption 
          selected={styles.spacing === 'spacious'}
          onClick={() => updateStyle('spacing', 'spacious')}
        >
          Spacious
        </RadioOption>
      </RadioGroup>
    </ControlGroup>

    {/* Layout Style */}
    <ControlGroup>
      <ControlLabel>Layout Style</ControlLabel>
      <RadioGroup>
        <RadioOption 
          selected={styles.layoutStyle === 'grid'}
          onClick={() => updateStyle('layoutStyle', 'grid')}
        >
          Grid
        </RadioOption>
        <RadioOption 
          selected={styles.layoutStyle === 'list'}
          onClick={() => updateStyle('layoutStyle', 'list')}
        >
          List
        </RadioOption>
        <RadioOption 
          selected={styles.layoutStyle === 'card'}
          onClick={() => updateStyle('layoutStyle', 'card')}
        >
          Card
        </RadioOption>
      </RadioGroup>
    </ControlGroup>

    {/* Divider Style */}
    <ControlGroup>
      <ControlLabel>Divider Style</ControlLabel>
      <RadioGroup>
        <RadioOption 
          selected={styles.dividerStyle === 'none'}
          onClick={() => updateStyle('dividerStyle', 'none')}
        >
          None
        </RadioOption>
        <RadioOption 
          selected={styles.dividerStyle === 'thin'}
          onClick={() => updateStyle('dividerStyle', 'thin')}
        >
          Thin
        </RadioOption>
        <RadioOption 
          selected={styles.dividerStyle === 'thick'}
          onClick={() => updateStyle('dividerStyle', 'thick')}
        >
          Thick
        </RadioOption>
        <RadioOption 
          selected={styles.dividerStyle === 'dotted'}
          onClick={() => updateStyle('dividerStyle', 'dotted')}
        >
          Dotted
        </RadioOption>
      </RadioGroup>
    </ControlGroup>

    {/* Toggle Switches */}
    <ControlGroup>
      <ControlLabel>
        <span>Accent Lines</span>
      </ControlLabel>
      <ToggleSwitch
        checked={styles.accentLines}
        onChange={(checked) => updateStyle('accentLines', checked)}
      />
    </ControlGroup>

    <ControlGroup>
      <ControlLabel>
        <span>Footer Bar</span>
      </ControlLabel>
      <ToggleSwitch
        checked={styles.footerBar}
        onChange={(checked) => updateStyle('footerBar', checked)}
      />
    </ControlGroup>
  </Section>
</LayoutTab>
```

**Spacing Values:**
```javascript
const spacingValues = {
  compact: {
    itemPadding: 12,
    itemGap: 8,
  },
  comfortable: {
    itemPadding: 16,
    itemGap: 12,
  },
  spacious: {
    itemPadding: 20,
    itemGap: 16,
  }
};

// Apply spacing to preview
const currentSpacing = spacingValues[styles.spacing];
```

**Divider Rendering in Preview:**
```jsx
const DividerComponent = ({ style }) => {
  if (style === 'none') return null;
  
  const dividerStyles = {
    thin: {
      height: '1px',
      background: 'rgba(255,255,255,0.1)',
    },
    thick: {
      height: '2px',
      background: 'rgba(255,255,255,0.15)',
    },
    dotted: {
      height: '1px',
      background: 'transparent',
      borderTop: '1px dotted rgba(255,255,255,0.2)',
    }
  };
  
  return <div style={dividerStyles[style]} />;
};
```

**Layout Style Application:**
```javascript
// In SchedulePreview component
const layoutClasses = {
  grid: 'schedule-grid',
  list: 'schedule-list',
  card: 'schedule-card'
};

<div className={`schedule-preview ${layoutClasses[styles.layoutStyle]}`}>
  {/* Schedule items */}
</div>
```

**Layout Style CSS:**
```css
.schedule-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--item-gap);
}

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: var(--item-gap);
}

.schedule-card {
  display: flex;
  flex-direction: column;
  gap: calc(var(--item-gap) * 1.5);
}

.schedule-card .schedule-item {
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
```

**Deliverable:** Complete layout tab with all controls updating preview in real-time.

---

## PHASE 7: SAVE & EXPORT

### Prompt 7.1: Build Save Functionality

**Task:** Implement template saving with success animation.

**Dependencies:** Requires all previous editor components

**Save Button Handler:**
```javascript
const [isSaving, setIsSaving] = useState(false);
const [saveSuccess, setSaveSuccess] = useState(false);

const handleSave = async () => {
  setIsSaving(true);
  
  try {
    // Prepare template data
    const template = {
      gymId: selectedGym.id,
      styles: styles,
      visibleElements: visibleElements,
      elementOrder: elementOrder,
      elementStyles: elementStyles,
      createdAt: new Date().toISOString(),
    };
    
    // API call to save
    await saveTemplate(template);
    
    // Show success state
    setSaveSuccess(true);
    setIsSaving(false);
    
    // Reset after 2s
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2000);
    
  } catch (error) {
    console.error('Save failed:', error);
    setIsSaving(false);
    // Show error toast
  }
};
```

**Save Button Component:**
```jsx
<Button
  variant="primary"
  onClick={handleSave}
  disabled={isSaving}
  className={saveSuccess ? 'success' : ''}
>
  {isSaving ? (
    <>
      <Spinner />
      <span>Saving...</span>
    </>
  ) : saveSuccess ? (
    <>
      <span>✓</span>
      <span>Saved!</span>
    </>
  ) : (
    <>
      <span>💾</span>
      <span>Save Template</span>
    </>
  )}
</Button>
```

**Success Animation:**
```css
.btn-primary.success {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  animation: successPulse 500ms ease-out;
}

@keyframes successPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}
```

**Spinner Component:**
```jsx
const Spinner = () => (
  <div className="spinner" />
);
```

**Spinner CSS:**
```css
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 800ms linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Deliverable:** Working save functionality with loading and success states.

---

### Prompt 7.2: Build Export Functionality

**Task:** Add ability to export templates as images.

**Dependencies:** Requires 7.1

**Export Button (Add to Header):**
```jsx
<Button 
  variant="secondary"
  onClick={handleExport}
>
  📥 Export
</Button>
```

**Export Logic:**
```javascript
const handleExport = async () => {
  try {
    // Use html2canvas or similar library
    const canvas = await html2canvas(previewRef.current, {
      backgroundColor: null,
      scale: 2, // 2x for retina
    });
    
    // Convert to blob
    canvas.toBlob((blob) => {
      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${gymName}-schedule-${Date.now()}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    });
    
  } catch (error) {
    console.error('Export failed:', error);
  }
};
```

**Alternative: Export Modal with Options:**
```jsx
const ExportModal = ({ isOpen, onClose }) => {
  const [format, setFormat] = useState('png');
  const [quality, setQuality] = useState('high');
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Template">
      <ControlGroup>
        <ControlLabel>Format</ControlLabel>
        <RadioGroup>
          <RadioOption 
            selected={format === 'png'}
            onClick={() => setFormat('png')}
          >
            PNG
          </RadioOption>
          <RadioOption 
            selected={format === 'jpg'}
            onClick={() => setFormat('jpg')}
          >
            JPG
          </RadioOption>
          <RadioOption 
            selected={format === 'pdf'}
            onClick={() => setFormat('pdf')}
          >
            PDF
          </RadioOption>
        </RadioGroup>
      </ControlGroup>
      
      <ControlGroup>
        <ControlLabel>Quality</ControlLabel>
        <RadioGroup>
          <RadioOption 
            selected={quality === 'standard'}
            onClick={() => setQuality('standard')}
          >
            Standard (1x)
          </RadioOption>
          <RadioOption 
            selected={quality === 'high'}
            onClick={() => setQuality('high')}
          >
            High (2x)
          </RadioOption>
          <RadioOption 
            selected={quality === 'ultra'}
            onClick={() => setQuality('ultra')}
          >
            Ultra (3x)
          </RadioOption>
        </RadioGroup>
      </ControlGroup>
      
      <ButtonGroup>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={() => performExport(format, quality)}
        >
          Export
        </Button>
      </ButtonGroup>
    </Modal>
  );
};
```

**Deliverable:** Working export functionality with format options.

---

## PHASE 8: ANIMATIONS & POLISH

### Prompt 8.1: Add Page Transition Animations

**Task:** Implement smooth transitions between screens.

**Dependencies:** Requires router setup

**Page Transition Wrapper:**
```jsx
const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ 
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      {children}
    </motion.div>
  );
};
```

**Usage:**
```jsx
<Routes>
  <Route path="/gym-finder" element={
    <PageTransition>
      <GymFinder />
    </PageTransition>
  } />
  <Route path="/editor" element={
    <PageTransition>
      <Editor />
    </PageTransition>
  } />
</Routes>
```

**Alternative without Framer Motion:**
```css
.page-enter {
  opacity: 0;
  transform: translateY(20px);
}

.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: all 300ms ease-out;
}

.page-exit {
  opacity: 1;
}

.page-exit-active {
  opacity: 0;
  transform: scale(0.95);
  transition: all 250ms ease-in;
}
```

**Deliverable:** Smooth page transitions throughout the app.

---

### Prompt 8.2: Add Micro-interactions

**Task:** Add subtle animations to interactive elements.

**Dependencies:** None (enhances existing components)

**Hover Animations:**
```css
/* Button hover lift */
.btn-primary {
  transition: transform 200ms ease-out, box-shadow 300ms ease-out;
}

.btn-primary:hover {
  transform: translateY(-2px);
}

.btn-primary:active {
  transform: translateY(0);
}

/* Card hover */
.palette-card,
.gym-item {
  transition: all 200ms ease-out;
}

.palette-card:hover,
.gym-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

/* Icon button pop */
.icon-btn {
  transition: all 150ms ease-out;
}

.icon-btn:hover {
  transform: scale(1.1);
}

.icon-btn:active {
  transform: scale(0.95);
}
```

**Focus Animations:**
```css
/* Input focus glow */
.form-input,
.search-input {
  transition: all 300ms ease;
}

.form-input:focus,
.search-input:focus {
  transform: scale(1.01);
  box-shadow: 0 0 0 4px rgba(139, 123, 216, 0.1);
}
```

**Loading States:**
```css
/* Skeleton loading */
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.05) 0%,
    rgba(255,255,255,0.1) 50%,
    rgba(255,255,255,0.05) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Deliverable:** Polished micro-interactions throughout the app.

---

### Prompt 8.3: Add Entrance Animations

**Task:** Implement staggered entrance animations for lists and grids.

**Dependencies:** None (enhances existing components)

**Stagger Animation Hook:**
```jsx
const useStaggerAnimation = (itemCount, delay = 50) => {
  return Array.from({ length: itemCount }, (_, i) => ({
    style: {
      animationDelay: `${i * delay}ms`
    }
  }));
};
```

**Usage in Components:**
```jsx
// In SavedGymsList
const GymsList = ({ gyms }) => {
  const animations = useStaggerAnimation(gyms.length);
  
  return (
    <div className="gym-list">
      {gyms.map((gym, index) => (
        <div 
          key={gym.id}
          className="gym-item animate-in"
          style={animations[index].style}
        >
          {/* Gym content */}
        </div>
      ))}
    </div>
  );
};
```

**Animation CSS:**
```css
.animate-in {
  opacity: 0;
  animation: fadeSlideIn 400ms ease-out forwards;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* For palette grid */
.palette-grid .palette-card {
  opacity: 0;
  animation: fadeSlideIn 400ms ease-out forwards;
}

.palette-grid .palette-card:nth-child(1) { animation-delay: 0ms; }
.palette-grid .palette-card:nth-child(2) { animation-delay: 50ms; }
.palette-grid .palette-card:nth-child(3) { animation-delay: 100ms; }
.palette-grid .palette-card:nth-child(4) { animation-delay: 150ms; }
```

**Hero Entrance (Gym Finder):**
```css
.hero-badge {
  opacity: 0;
  animation: fadeSlideIn 600ms ease-out 200ms forwards;
}

.hero-title {
  opacity: 0;
  animation: fadeSlideIn 600ms ease-out 300ms forwards;
}

.hero-subtitle {
  opacity: 0;
  animation: fadeSlideIn 600ms ease-out 400ms forwards;
}

.card {
  opacity: 0;
  animation: fadeSlideIn 600ms ease-out 500ms forwards;
}
```

**Deliverable:** Smooth entrance animations for all major UI elements.

---

## PHASE 9: RESPONSIVE & MOBILE

### Prompt 9.1: Make Gym Finder Responsive

**Task:** Ensure gym finder works perfectly on mobile.

**Dependencies:** Requires 2.1, 2.2, 2.3 (Gym Finder components)

**Mobile Breakpoint:**
```css
@media (max-width: 640px) {
  /* Header adjustments */
  .header {
    padding: 20px;
  }
  
  .logo {
    font-size: 20px;
  }
  
  .logo-icon {
    width: 28px;
    height: 28px;
  }
  
  /* Hero adjustments */
  .hero-title {
    font-size: 32px;
  }
  
  .hero-subtitle {
    font-size: 15px;
  }
  
  /* Card adjustments */
  .card {
    padding: 28px 24px;
  }
  
  /* Search results full width */
  .search-results {
    left: -24px;
    right: -24px;
    width: calc(100% + 48px);
    border-radius: 0;
  }
  
  /* Gym items larger touch targets */
  .gym-item {
    padding: 16px;
    min-height: 68px;
  }
  
  /* Button adjustments */
  .btn {
    padding: 14px 20px;
    font-size: 15px;
  }
}
```

**Touch-friendly Improvements:**
```css
/* Increase touch targets */
.gym-item,
.palette-card,
.icon-btn {
  min-height: 44px; /* iOS minimum */
  min-width: 44px;
}

/* Prevent double-tap zoom */
button,
.clickable {
  touch-action: manipulation;
}

/* Smooth scrolling on mobile */
.panel-content,
.search-results {
  -webkit-overflow-scrolling: touch;
}
```

**Deliverable:** Fully responsive gym finder that works great on mobile.

---

### Prompt 9.2: Make Editor Mobile-Friendly

**Task:** Create a mobile-optimized version of the editor.

**Dependencies:** Requires all Phase 3-6 components

**Mobile Layout Strategy:**
```
Mobile: Stack vertically
- Preview on top (fixed aspect ratio)
- Tabs below
- Content in scrollable area
- Bottom action bar

Desktop: Side-by-side (existing layout)
```

**Responsive Layout:**
```css
@media (max-width: 1024px) {
  /* Stack layout */
  .main-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
  
  .canvas-area {
    height: 400px;
    padding: 24px;
  }
  
  .preview-frame {
    max-width: 280px;
    max-height: 500px;
  }
  
  .right-panel {
    width: 100%;
    border-left: none;
    border-top: 1px solid rgba(255,255,255,0.1);
  }
  
  .resize-handle {
    display: none;
  }
  
  /* Full-screen modals on mobile */
  .modal-content {
    width: 100%;
    max-width: 100%;
    height: 100vh;
    border-radius: 0;
  }
}
```

**Bottom Action Bar (Mobile):**
```jsx
@media (max-width: 640px) {
  .header .right {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 16px 20px;
    background: rgba(15,23,42,0.98);
    backdrop-filter: blur(20px);
    border-top: 1px solid rgba(255,255,255,0.1);
    display: flex;
    gap: 12px;
    z-index: 100;
  }
  
  .header .right .btn {
    flex: 1;
  }
}
```

**Deliverable:** Mobile-optimized editor with stacked layout.

---

## PHASE 10: TESTING & QA

### Prompt 10.1: Add Loading States

**Task:** Implement loading states for all async operations.

**Dependencies:** Requires all previous components

**Loading States to Add:**

1. **Gym Search Loading:**
```jsx
const [isSearching, setIsSearching] = useState(false);

// In search handler
setIsSearching(true);
const results = await searchGyms(query);
setIsSearching(false);

// In UI
{isSearching && (
  <LoadingState>
    <Spinner />
    <span>Searching gyms...</span>
  </LoadingState>
)}
```

2. **Template Loading:**
```jsx
const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);

useEffect(() => {
  loadTemplate()
    .then(data => {
      setStyles(data.styles);
      setIsLoadingTemplate(false);
    });
}, []);

if (isLoadingTemplate) {
  return <EditorSkeleton />;
}
```

3. **Preview Loading:**
```jsx
const [isPreviewLoading, setIsPreviewLoading] = useState(false);

// When switching device/styles
setIsPreviewLoading(true);
await updatePreview();
setTimeout(() => setIsPreviewLoading(false), 300);
```

**Skeleton Component:**
```jsx
const EditorSkeleton = () => (
  <div className="editor-skeleton">
    <div className="skeleton-header" />
    <div className="skeleton-body">
      <div className="skeleton-canvas" />
      <div className="skeleton-panel">
        <div className="skeleton-tabs" />
        <div className="skeleton-content" />
      </div>
    </div>
  </div>
);
```

**Deliverable:** All async operations have proper loading states.

---

### Prompt 10.2: Add Error Handling

**Task:** Implement error handling and user feedback.

**Dependencies:** Requires all previous components

**Error Handling Patterns:**

1. **API Errors:**
```jsx
const [error, setError] = useState(null);

try {
  await saveTemplate(data);
} catch (err) {
  setError(err.message);
  // Show error toast
  showToast({
    type: 'error',
    message: 'Failed to save template',
    action: 'Try Again'
  });
}
```

2. **Validation Errors:**
```jsx
const [fieldErrors, setFieldErrors] = useState({});

const validateForm = () => {
  const errors = {};
  
  if (!gymName.trim()) {
    errors.gymName = 'Gym name is required';
  }
  
  if (!gymUrl.includes('mindbody')) {
    errors.gymUrl = 'Must be a valid Mindbody URL';
  }
  
  setFieldErrors(errors);
  return Object.keys(errors).length === 0;
};
```

3. **Toast Notification System:**
```jsx
const Toast = ({ type, message, action, onAction, onClose }) => (
  <div className={`toast toast-${type}`}>
    <ToastIcon type={type} />
    <ToastMessage>{message}</ToastMessage>
    {action && (
      <ToastAction onClick={onAction}>{action}</ToastAction>
    )}
    <ToastClose onClick={onClose}>×</ToastClose>
  </div>
);

// Toast CSS
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: rgba(15,23,42,0.98);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  animation: slideInUp 300ms ease-out;
  z-index: 9999;
}

.toast-error {
  border-color: rgba(239,68,68,0.5);
}

.toast-success {
  border-color: rgba(16,185,129,0.5);
}
```

**Deliverable:** Complete error handling with user-friendly messages.

---

## IMPLEMENTATION ORDER SUMMARY

**Week 1: Foundation**
- Day 1-2: Prompts 1.1, 1.2 (Design System + Base Components)
- Day 3-4: Prompts 2.1, 2.2, 2.3 (Gym Finder Screens)
- Day 5: Testing & fixes

**Week 2: Editor Structure**
- Day 1-2: Prompt 3.1 (Editor Layout)
- Day 3: Prompt 3.2 (Schedule Preview)
- Day 4: Prompts 4.1, 4.2 (Style Tab)
- Day 5: Testing & fixes

**Week 3: Editor Content**
- Day 1-2: Prompts 5.1, 5.2, 5.3 (Content Tab + Modals)
- Day 3: Prompt 6.1 (Layout Tab)
- Day 4: Prompts 7.1, 7.2 (Save & Export)
- Day 5: Testing & fixes

**Week 4: Polish & Launch**
- Day 1-2: Prompts 8.1, 8.2, 8.3 (Animations)
- Day 3: Prompts 9.1, 9.2 (Responsive)
- Day 4: Prompts 10.1, 10.2 (Loading & Errors)
- Day 5: Final QA and launch prep

---

## NOTES FOR IMPLEMENTATION

**State Management:**
Consider using React Context or a state management library for:
- Current gym selection
- Template styles
- Visible elements
- Element order
- User preferences

**API Integration:**
Mock APIs during development, then replace with real endpoints:
- `searchGyms(query)` - Search Mindbody gyms
- `saveGym(data)` - Save gym to user account
- `saveTemplate(data)` - Save template
- `loadTemplate(id)` - Load existing template

**Testing:**
- Unit tests for utility functions
- Component tests for interactive elements
- Integration tests for full flows
- Visual regression tests for UI

**Performance:**
- Debounce search input
- Throttle preview updates
- Lazy load modals
- Optimize images

---

END OF IMPLEMENTATION GUIDE
