// src/workbench/apps/ConsultationApp.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useWorkbench } from '@/contexts/WorkbenchContext'
import {
  getConsultationSlots,
  bookConsultation,
  getMyConsultations,
  cancelConsultation,
  adminCreateSlot,
  adminDeleteSlot,
  adminBulkCreateSlots,
  adminGetAllBookings,
  adminCancelBooking,
  verifyPayment
} from '@/services/workbenchService'

const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const WEEKDAYS_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December']

const CONSULTATION_TYPES = [
  { key: 'clinical', label: 'Clinical Consultation', color: '#89b4fa', icon: '🩺' },
  { key: 'counseling', label: 'Genetic Counseling', color: '#a6e3a1', icon: '🧬' },
  { key: 'laboratory', label: 'Laboratory Genetic Analysis', color: '#cba6f7', icon: '🔬' },
]

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

function formatDate(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return { year: y, month: m - 1, day: d }
}

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(m) {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

function generateTimeSlots(startTime, endTime, duration, breakStart, breakEnd) {
  const slots = []
  let current = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  const bStart = breakStart ? timeToMinutes(breakStart) : null
  const bEnd = breakEnd ? timeToMinutes(breakEnd) : null

  while (current + duration <= end) {
    if (bStart !== null && bEnd !== null) {
      if (current >= bStart && current < bEnd) {
        current = bEnd
        continue
      }
      if (current < bStart && current + duration > bStart) {
        current = bEnd
        continue
      }
    }
    slots.push(minutesToTime(current))
    current += duration
  }
  return slots
}

const ConsultationApp = () => {
  const { user, isAdmin } = useWorkbench()
  const [activeTab, setActiveTab] = useState('schedule')
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth())
  const [slots, setSlots] = useState([])
  const [myConsultations, setMyConsultations] = useState([])
  const [allBookings, setAllBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [bookingSlot, setBookingSlot] = useState(null)
  const [bookingForm, setBookingForm] = useState({ patientName: '', patientEmail: '', reason: '', type: 'clinical' })
  const [message, setMessage] = useState({ text: '', type: '' })

  const [adminMode, setAdminMode] = useState('calendar')
  const [bulkForm, setBulkForm] = useState({
    selectedDates: [],
    startTime: '08:00',
    endTime: '17:00',
    duration: 30,
    breakStart: '12:00',
    breakEnd: '13:00',
    hasBreak: true,
    allowedTypes: ['clinical', 'counseling', 'laboratory'],
  })

  const [cancelReason, setCancelReason] = useState('')
  const [cancellingId, setCancellingId] = useState(null)

  const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`

  const showMsg = (text, type) => {
    setMessage({ text, type })
    setTimeout(() => setMessage({ text: '', type: '' }), 5000)
  }

  const loadSlots = useCallback(async () => {
    setLoading(true)
    const res = await getConsultationSlots(monthKey)
    if (res.success) setSlots(res.slots || [])
    setLoading(false)
  }, [monthKey])

  const loadMyConsultations = useCallback(async () => {
    setLoading(true)
    const res = await getMyConsultations()
    if (res.success) {
      setMyConsultations(res.consultations || [])
      ;(res.consultations || []).forEach(c => {
        if (c.payment_status === 'pending') {
          verifyPayment(c.id).then(vRes => {
            if (vRes.success && vRes.status === 'paid') {
              setMyConsultations(prev => prev.map(p => p.id === c.id ? { ...p, payment_status: 'paid' } : p))
            }
          })
        }
      })
    }
    setLoading(false)
  }, [])

  const loadAllBookings = useCallback(async () => {
    setLoading(true)
    const res = await adminGetAllBookings(monthKey)
    if (res.success) setAllBookings(res.bookings || [])
    setLoading(false)
  }, [monthKey])

  useEffect(() => {
    loadSlots()
  }, [loadSlots])

  useEffect(() => {
    if (activeTab === 'my') loadMyConsultations()
    if (activeTab === 'admin') { loadSlots(); loadAllBookings() }
  }, [activeTab])

  const slotsByDate = useMemo(() => {
    const map = {}
    slots.forEach(s => {
      if (!map[s.date_slot]) map[s.date_slot] = []
      map[s.date_slot].push(s)
    })
    Object.keys(map).forEach(k => map[k].sort((a, b) => a.time_slot.localeCompare(b.time_slot)))
    return map
  }, [slots])

  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }
  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }

  const handleBook = async () => {
    if (!bookingSlot) return
    setLoading(true)
    const res = await bookConsultation({ slotId: bookingSlot.id, ...bookingForm })
    setLoading(false)
    if (res.success) {
      showMsg('Redirecting to Stripe Checkout...', 'success')
      setBookingSlot(null)
      if (res.checkoutUrl) window.location.href = res.checkoutUrl
      else loadSlots()
    } else {
      showMsg(res.error || 'Failed to book.', 'error')
    }
  }

  const handleClientCancel = async (id) => {
    if (!cancelReason.trim()) { showMsg('Please provide a cancellation reason.', 'error'); return }
    const res = await cancelConsultation(id, cancelReason)
    if (res.success) { showMsg('Consultation cancelled successfully.', 'success'); setCancellingId(null); setCancelReason(''); loadMyConsultations() }
    else showMsg(res.error || 'Failed to cancel.', 'error')
  }

  const handleAdminCancel = async (id) => {
    if (!cancelReason.trim()) { showMsg('Please provide a cancellation reason.', 'error'); return }
    const res = await adminCancelBooking(id, cancelReason)
    if (res.success) { showMsg('Booking cancelled successfully.', 'success'); setCancellingId(null); setCancelReason(''); loadSlots(); loadAllBookings() }
    else showMsg(res.error || 'Failed to cancel.', 'error')
  }

  const handleAdminDeleteSlot = async (id) => {
    if (!window.confirm('Delete this slot permanently?')) return
    const res = await adminDeleteSlot(id)
    if (res.success) { showMsg('Slot deleted.', 'success'); loadSlots() }
    else showMsg(res.error || 'Failed to delete.', 'error')
  }

  const toggleBulkDate = (dateStr) => {
    setBulkForm(prev => ({
      ...prev,
      selectedDates: prev.selectedDates.includes(dateStr)
        ? prev.selectedDates.filter(d => d !== dateStr)
        : [...prev.selectedDates, dateStr]
    }))
  }

  const handleBulkCreate = async () => {
    if (bulkForm.selectedDates.length === 0) { showMsg('Select at least one date on the calendar.', 'error'); return }
    if (bulkForm.allowedTypes.length === 0) { showMsg('Select at least one consultation type.', 'error'); return }
    setLoading(true)
    const res = await adminBulkCreateSlots({
      dates: bulkForm.selectedDates,
      startTime: bulkForm.startTime,
      endTime: bulkForm.endTime,
      duration: bulkForm.duration,
      breakStart: bulkForm.hasBreak ? bulkForm.breakStart : null,
      breakEnd: bulkForm.hasBreak ? bulkForm.breakEnd : null,
      allowedTypes: bulkForm.allowedTypes,
    })
    setLoading(false)
    if (res.success) { showMsg(`${res.created || 0} slot(s) created successfully!`, 'success'); setBulkForm(prev => ({ ...prev, selectedDates: [] })); loadSlots() }
    else showMsg(res.error || 'Failed to create slots.', 'error')
  }

  const previewSlots = useMemo(() => {
    if (bulkForm.selectedDates.length === 0) return []
    return generateTimeSlots(bulkForm.startTime, bulkForm.endTime, bulkForm.duration, bulkForm.hasBreak ? bulkForm.breakStart : null, bulkForm.hasBreak ? bulkForm.breakEnd : null)
  }, [bulkForm.startTime, bulkForm.endTime, bulkForm.duration, bulkForm.breakStart, bulkForm.breakEnd, bulkForm.hasBreak, bulkForm.selectedDates])

  const renderCalendar = (onDateClick, highlightDates = {}, selectable = false, selectedDates = []) => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
    const cells = []
    const today = new Date()
    const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate())

    for (let i = 0; i < firstDay; i++) cells.push(<div key={`e-${i}`} className="cs-calendar-cell-empty" />)

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDate(currentYear, currentMonth, d)
      const daySlots = highlightDates[dateStr] || []
      const isToday = dateStr === todayStr
      const isPast = new Date(dateStr) < new Date(todayStr)
      const isSelected = selectedDates.includes(dateStr)
      const hasAvailable = daySlots.some(s => s.is_booked == 0)
      const hasBooked = daySlots.some(s => s.is_booked == 1)
      const totalSlots = daySlots.length
      const availableCount = daySlots.filter(s => s.is_booked == 0).length
      const clickable = (selectable && !isPast) || (!selectable && totalSlots > 0)

      let cls = 'cs-calendar-cell'
      if (clickable) cls += ' cs-calendar-cell-clickable'
      if (isToday) cls += ' cs-calendar-cell-today'
      if (isSelected) cls += ' cs-calendar-cell-selected'
      if (isPast && !selectable) cls += ' cs-calendar-cell-past'

      cells.push(
        <div key={d} className={cls} onClick={() => { if (clickable) onDateClick(dateStr) }}>
          <div className="cs-calendar-day">{d}</div>
          {totalSlots > 0 && (
            <div className="cs-calendar-dots">
              {hasAvailable && <div className="cs-calendar-dot-available" title={`${availableCount} available`} />}
              {hasBooked && <div className="cs-calendar-dot-booked" title="Has bookings" />}
            </div>
          )}
          {totalSlots > 0 && <div className="cs-calendar-count">{availableCount}/{totalSlots}</div>}
        </div>
      )
    }
    return cells
  }

  const renderMonthNav = () => (
    <div className="cs-month-nav">
      <button className="cs-nav-btn" onClick={handlePrevMonth}>◀</button>
      <span>{MONTHS_FULL[currentMonth]} {currentYear}</span>
      <button className="cs-nav-btn" onClick={handleNextMonth}>▶</button>
    </div>
  )

  const renderCalendarHeader = () => (
    <div className="cs-calendar-grid">
      {WEEKDAYS.map(w => <div key={w} className="cs-calendar-header-cell">{w}</div>)}
    </div>
  )

  const renderScheduleTab = () => {
    if (bookingSlot) {
      const allowedTypes = bookingSlot.allowed_types ? bookingSlot.allowed_types.split(',') : ['clinical', 'counseling', 'laboratory']
      return (
        <div style={{ maxWidth: '460px', margin: '0 auto', padding: '20px' }}>
          <div className="cs-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="cs-section-title" style={{ margin: 0 }}>Book Consultation</h3>
              <button className="cs-btn-ghost" onClick={() => setBookingSlot(null)}>✕ Back</button>
            </div>
            <div className="cs-info-row">
              <span className="cs-info-row-label">Date:</span>
              <span className="cs-info-row-value">{bookingSlot.date_slot}</span>
            </div>
            <div className="cs-info-row">
              <span className="cs-info-row-label">Time:</span>
              <span className="cs-info-row-value">{bookingSlot.time_slot}</span>
            </div>
            <div style={{ margin: '16px 0 8px' }}><span className="cs-label">Consultation Type</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {CONSULTATION_TYPES.filter(ct => allowedTypes.includes(ct.key)).map(ct => (
                <div
                  key={ct.key}
                  className={'cs-type-option' + (bookingForm.type === ct.key ? ' cs-type-option-selected' : '')}
                  style={{ borderColor: bookingForm.type === ct.key ? ct.color : undefined }}
                  onClick={() => setBookingForm(prev => ({ ...prev, type: ct.key }))}
                >
                  <span className="cs-type-option-icon">{ct.icon}</span>
                  <span className="cs-type-option-label">{ct.label}</span>
                  {bookingForm.type === ct.key && <span className="cs-type-option-check" style={{ color: ct.color }}>✓</span>}
                </div>
              ))}
            </div>
            <input className="cs-input" type="text" placeholder="Full Name" value={bookingForm.patientName} onChange={e => setBookingForm(p => ({ ...p, patientName: e.target.value }))} />
            <input className="cs-input" type="email" placeholder="Email" value={bookingForm.patientEmail} onChange={e => setBookingForm(p => ({ ...p, patientEmail: e.target.value }))} />
            <textarea className="cs-input" style={{ resize: 'vertical', minHeight: '60px' }} placeholder="Reason for consultation (optional)" value={bookingForm.reason} onChange={e => setBookingForm(p => ({ ...p, reason: e.target.value }))} />
            <button className="cs-btn-primary" style={{ width: '100%', marginTop: '8px' }} onClick={handleBook} disabled={loading}>
              {loading ? 'Processing...' : '💳 Pay & Book'}
            </button>
          </div>
        </div>
      )
    }

    if (selectedDate) {
      const daySlots = slotsByDate[selectedDate] || []
      const { year, month, day } = parseDate(selectedDate)
      const dayName = WEEKDAYS_FULL[new Date(year, month, day).getDay()]

      return (
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <button className="cs-btn-ghost" onClick={() => setSelectedDate(null)}>◀ Calendar</button>
            <h3 className="cs-section-title" style={{ margin: 0 }}>{dayName}, {selectedDate}</h3>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div className="cs-legend-item"><div className="cs-legend-dot cs-legend-dot-available" /> Available</div>
            <div className="cs-legend-item"><div className="cs-legend-dot cs-legend-dot-booked" /> Booked</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
            {daySlots.map(s => {
              const isAvailable = s.is_booked == 0
              const allowedTypes = s.allowed_types ? s.allowed_types.split(',') : ['clinical', 'counseling', 'laboratory']
              return (
                <div
                  key={s.id}
                  className={'cs-slot-card' + (isAvailable ? ' cs-slot-card-available' : ' cs-slot-card-booked')}
                  onClick={() => {
                    if (isAvailable) {
                      setBookingSlot(s)
                      setBookingForm({ patientName: user?.full_name || '', patientEmail: user?.email || '', reason: '', type: allowedTypes[0] || 'clinical' })
                    }
                  }}
                >
                  <div className={'cs-slot-time' + (isAvailable ? ' cs-slot-time-available' : ' cs-slot-time-booked')}>{s.time_slot}</div>
                  <div className={'cs-slot-status' + (isAvailable ? ' cs-slot-status-available' : ' cs-slot-status-booked')}>
                    {isAvailable ? 'Available' : 'Booked'}
                  </div>
                  {isAvailable && (
                    <div className="cs-slot-types">
                      {allowedTypes.map(t => {
                        const ct = CONSULTATION_TYPES.find(c => c.key === t)
                        return ct ? <span key={t} className="cs-slot-type-icon" title={ct.label}>{ct.icon}</span> : null
                      })}
                    </div>
                  )}
                  {isAvailable && <div className="cs-slot-cta">Click to book</div>}
                </div>
              )
            })}
          </div>
          {daySlots.length === 0 && <div className="cs-empty-state">No slots available for this date.</div>}
        </div>
      )
    }

    return (
      <div style={{ padding: '16px' }}>
        <div className="cs-hint-text">Select a date to view available time slots</div>
        {renderMonthNav()}
        {renderCalendarHeader()}
        <div className="cs-calendar-grid">{renderCalendar((dateStr) => setSelectedDate(dateStr), slotsByDate)}</div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div className="cs-legend-item"><div className="cs-legend-dot cs-legend-dot-available" /> Has available slots</div>
          <div className="cs-legend-item"><div className="cs-legend-dot cs-legend-dot-booked" /> Has bookings</div>
        </div>
      </div>
    )
  }

  const renderMyConsultations = () => (
    <div style={{ padding: '16px' }}>
      <h3 className="cs-section-title">My Consultations</h3>
      {loading && <div className="cs-empty-state">Loading...</div>}
      {!loading && myConsultations.length === 0 && <div className="cs-empty-state">No consultations booked yet.</div>}
      {myConsultations.map(c => {
        const ct = CONSULTATION_TYPES.find(t => t.key === c.consultation_type)
        const isCancelling = cancellingId === c.id
        return (
          <div key={c.id} className="cs-card" style={{ marginBottom: '10px' }}>
            <div className="cs-consultation-item">
              <div className="cs-consultation-info">
                <div className="cs-consultation-header">
                  <span className="cs-consultation-icon">{ct?.icon || '📋'}</span>
                  <span className="cs-consultation-datetime">{c.date_slot} at {c.time_slot}</span>
                  <span className={'cs-badge cs-badge-' + (c.payment_status || 'pending')}>
                    {c.payment_status === 'paid' ? 'Paid' : c.payment_status === 'pending' ? 'Payment Pending' : c.payment_status === 'cancelled' ? 'Cancelled' : c.payment_status}
                  </span>
                </div>
                <div className="cs-consultation-detail">Type: {ct?.label || c.consultation_type}</div>
                <div className="cs-consultation-detail">Patient: {c.patient_name}</div>
                {c.cancel_reason && <div className="cs-consultation-cancel-reason">Cancellation reason: {c.cancel_reason}</div>}
              </div>
              {c.payment_status !== 'cancelled' && (
                <div>
                  {!isCancelling ? (
                    <button className="cs-btn-danger" onClick={() => { setCancellingId(c.id); setCancelReason('') }}>Cancel</button>
                  ) : (
                    <div className="cs-cancel-form">
                      <textarea className="cs-input cs-cancel-textarea" placeholder="Reason for cancellation..." value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
                      <div className="cs-cancel-actions">
                        <button className="cs-btn-danger" style={{ flex: 1 }} onClick={() => handleClientCancel(c.id)}>Confirm</button>
                        <button className="cs-btn-ghost" style={{ flex: 1 }} onClick={() => setCancellingId(null)}>Back</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )

  const renderAdminTab = () => (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        <button className={'cs-sub-tab-btn' + (adminMode === 'calendar' ? ' cs-sub-tab-active' : '')} onClick={() => setAdminMode('calendar')}>📅 Manage Slots</button>
        <button className={'cs-sub-tab-btn' + (adminMode === 'bookings' ? ' cs-sub-tab-active' : '')} onClick={() => setAdminMode('bookings')}>📋 Bookings</button>
        <button className={'cs-sub-tab-btn' + (adminMode === 'overview' ? ' cs-sub-tab-active' : '')} onClick={() => setAdminMode('overview')}>📊 Overview</button>
      </div>

      {adminMode === 'calendar' && (
        <div className="cs-admin-layout">
          <div className="cs-admin-calendar-col">
            <div className="cs-hint-text">Click dates to select, then configure time slots</div>
            {renderMonthNav()}
            {renderCalendarHeader()}
            <div className="cs-calendar-grid">
              {renderCalendar((dateStr) => toggleBulkDate(dateStr), slotsByDate, true, bulkForm.selectedDates)}
            </div>
            {bulkForm.selectedDates.length > 0 && (
              <div className="cs-selected-dates-panel">
                <div className="cs-selected-dates-label">Selected dates ({bulkForm.selectedDates.length}):</div>
                <div className="cs-selected-dates-list">
                  {bulkForm.selectedDates.sort().map(d => (
                    <span key={d} className="cs-date-pill">
                      {d}
                      <span className="cs-date-pill-remove" onClick={() => toggleBulkDate(d)}>✕</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="cs-admin-config-col">
            <div className="cs-card">
              <h4 className="cs-section-subtitle">⏰ Time Configuration</h4>
              <div className="cs-time-row">
                <div>
                  <label className="cs-label">Start Time</label>
                  <input type="time" className="cs-input" value={bulkForm.startTime} onChange={e => setBulkForm(p => ({ ...p, startTime: e.target.value }))} />
                </div>
                <div>
                  <label className="cs-label">End Time</label>
                  <input type="time" className="cs-input" value={bulkForm.endTime} onChange={e => setBulkForm(p => ({ ...p, endTime: e.target.value }))} />
                </div>
              </div>
              <label className="cs-label">Slot Duration (minutes)</label>
              <select className="cs-input" value={bulkForm.duration} onChange={e => setBulkForm(p => ({ ...p, duration: parseInt(e.target.value) }))}>
                <option value={15}>15 min</option>
                <option value={20}>20 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
              </select>
              <label className="cs-break-toggle">
                <input type="checkbox" checked={bulkForm.hasBreak} onChange={e => setBulkForm(p => ({ ...p, hasBreak: e.target.checked }))} />
                Break / Lunch Period
              </label>
              {bulkForm.hasBreak && (
                <div className="cs-break-row">
                  <div>
                    <label className="cs-label">Break Start</label>
                    <input type="time" className="cs-input" value={bulkForm.breakStart} onChange={e => setBulkForm(p => ({ ...p, breakStart: e.target.value }))} />
                  </div>
                  <div>
                    <label className="cs-label">Break End</label>
                    <input type="time" className="cs-input" value={bulkForm.breakEnd} onChange={e => setBulkForm(p => ({ ...p, breakEnd: e.target.value }))} />
                  </div>
                </div>
              )}
            </div>

            <div className="cs-card" style={{ marginTop: '10px' }}>
              <h4 className="cs-section-subtitle">🩺 Allowed Consultation Types</h4>
              {CONSULTATION_TYPES.map(ct => (
                <label key={ct.key} className={'cs-type-check-label' + (bulkForm.allowedTypes.includes(ct.key) ? ' cs-type-check-active' : '')}>
                  <input
                    type="checkbox"
                    checked={bulkForm.allowedTypes.includes(ct.key)}
                    onChange={e => {
                      setBulkForm(p => ({
                        ...p,
                        allowedTypes: e.target.checked ? [...p.allowedTypes, ct.key] : p.allowedTypes.filter(t => t !== ct.key)
                      }))
                    }}
                  />
                  <span className="cs-type-check-icon">{ct.icon}</span>
                  <span className="cs-type-check-name">{ct.label}</span>
                </label>
              ))}
            </div>

            {previewSlots.length > 0 && bulkForm.selectedDates.length > 0 && (
              <div className="cs-card" style={{ marginTop: '10px' }}>
                <h4 className="cs-section-subtitle">Preview ({previewSlots.length} slots × {bulkForm.selectedDates.length} day(s) = {previewSlots.length * bulkForm.selectedDates.length} total)</h4>
                <div className="cs-preview-slots">
                  {previewSlots.map(t => <span key={t} className="cs-preview-slot">{t}</span>)}
                </div>
              </div>
            )}

            <button className="cs-btn-primary" style={{ width: '100%', marginTop: '12px' }} onClick={handleBulkCreate} disabled={loading || bulkForm.selectedDates.length === 0}>
              {loading ? 'Creating...' : `Create ${previewSlots.length * bulkForm.selectedDates.length} Slot(s)`}
            </button>
          </div>
        </div>
      )}

      {adminMode === 'bookings' && (
        <div>
          <h4 className="cs-section-title">Bookings for {MONTHS_FULL[currentMonth]} {currentYear}</h4>
          {renderMonthNav()}
          {allBookings.length === 0 && <div className="cs-empty-state">No bookings this month.</div>}
          {allBookings.map(b => {
            const ct = CONSULTATION_TYPES.find(t => t.key === b.consultation_type)
            const isCancelling = cancellingId === `admin-${b.id}`
            return (
              <div key={b.id} className="cs-card" style={{ marginBottom: '8px' }}>
                <div className="cs-consultation-item">
                  <div className="cs-consultation-info">
                    <div className="cs-consultation-header">
                      <span className="cs-consultation-icon">{ct?.icon || '📋'}</span>
                      <span className="cs-consultation-datetime">{b.date_slot} at {b.time_slot}</span>
                      <span className={'cs-badge cs-badge-' + (b.payment_status || 'pending')}>{b.payment_status}</span>
                    </div>
                    <div className="cs-consultation-detail">Patient: {b.patient_name} ({b.patient_email})</div>
                    <div className="cs-consultation-detail">Type: {ct?.label || b.consultation_type}</div>
                    {b.reason && <div className="cs-consultation-detail" style={{ opacity: 0.7 }}>Reason: {b.reason}</div>}
                    {b.cancel_reason && <div className="cs-consultation-cancel-reason">Cancellation: {b.cancel_reason}</div>}
                  </div>
                  {b.payment_status !== 'cancelled' && (
                    <div>
                      {!isCancelling ? (
                        <button className="cs-btn-danger" onClick={() => { setCancellingId(`admin-${b.id}`); setCancelReason('') }}>Cancel</button>
                      ) : (
                        <div className="cs-cancel-form">
                          <textarea className="cs-input cs-cancel-textarea" placeholder="Reason (sent to patient)..." value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
                          <div className="cs-cancel-actions">
                            <button className="cs-btn-danger" style={{ flex: 1 }} onClick={() => handleAdminCancel(b.id)}>Confirm</button>
                            <button className="cs-btn-ghost" style={{ flex: 1 }} onClick={() => setCancellingId(null)}>Back</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {adminMode === 'overview' && (
        <div>
          {renderMonthNav()}
          {renderCalendarHeader()}
          <div className="cs-calendar-grid">
            {renderCalendar((dateStr) => setSelectedDate(dateStr), slotsByDate)}
          </div>
          {selectedDate && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <h4 className="cs-section-title" style={{ margin: 0 }}>Slots for {selectedDate}</h4>
                <button className="cs-btn-ghost" onClick={() => setSelectedDate(null)}>✕ Close</button>
              </div>
              {(slotsByDate[selectedDate] || []).map(s => (
                <div key={s.id} className="cs-card" style={{ marginBottom: '6px' }}>
                  <div className="cs-admin-slot-row">
                    <div className="cs-admin-slot-info">
                      <span className="cs-admin-slot-time">{s.time_slot}</span>
                      {s.is_booked == 1 ? (
                        <span className="cs-admin-slot-status cs-admin-slot-booked">Booked — {s.patient_name} ({s.payment_status})</span>
                      ) : (
                        <span className="cs-admin-slot-status cs-admin-slot-available">Available</span>
                      )}
                      {s.allowed_types && <span className="cs-admin-slot-types">[{s.allowed_types}]</span>}
                    </div>
                    {s.is_booked == 0 && (
                      <button className="cs-btn-danger" style={{ fontSize: '0.65rem', padding: '3px 8px' }} onClick={() => handleAdminDeleteSlot(s.id)}>Delete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="cs-container">
      <div className="cs-toolbar">
        <button className={'cs-tab-btn' + (activeTab === 'schedule' ? ' cs-tab-active' : '')} onClick={() => { setActiveTab('schedule'); setSelectedDate(null); setBookingSlot(null) }}>📅 Schedule</button>
        <button className={'cs-tab-btn' + (activeTab === 'my' ? ' cs-tab-active' : '')} onClick={() => setActiveTab('my')}>📋 My Consultations</button>
        {isAdmin && <button className={'cs-tab-btn' + (activeTab === 'admin' ? ' cs-tab-active' : '')} onClick={() => setActiveTab('admin')}>⚙️ Admin Panel</button>}
      </div>

      {message.text && <div className={'cs-msg' + (message.type === 'error' ? ' cs-msg-error' : ' cs-msg-success')}>{message.text}</div>}

      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'schedule' && renderScheduleTab()}
        {activeTab === 'my' && renderMyConsultations()}
        {activeTab === 'admin' && isAdmin && renderAdminTab()}
      </div>
    </div>
  )
}

export default ConsultationApp