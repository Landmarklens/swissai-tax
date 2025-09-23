import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DecisionModal from '../DecisionModal';

describe('DecisionModal', () => {
  const mockApplication = {
    id: '123',
    name: 'John Doe',
    score: 75,
    lead_status: 'pending'
  };

  const mockOnConfirm = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // Increase timeout for MUI Dialog animations
  jest.setTimeout(10000);

  it('renders correctly when open', () => {
    render(
      <DecisionModal
        open={true}
        onClose={mockOnClose}
        application={mockApplication}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText('Make Decision for Application')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('75/100')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <DecisionModal
        open={false}
        onClose={mockOnClose}
        application={mockApplication}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.queryByText('Make Decision for Application')).not.toBeInTheDocument();
  });

  it('shows error when submitting without selection', () => {
    render(
      <DecisionModal
        open={true}
        onClose={mockOnClose}
        application={mockApplication}
        onConfirm={mockOnConfirm}
      />
    );

    const confirmButton = screen.getByText('Confirm Decision');
    
    // Click without selecting anything
    fireEvent.click(confirmButton);
    
    // Verify that onConfirm was NOT called (which means validation failed)
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('requires reason for rejection', async () => {
    render(
      <DecisionModal
        open={true}
        onClose={mockOnClose}
        application={mockApplication}
        onConfirm={mockOnConfirm}
      />
    );

    // Select reject option
    const rejectRadio = screen.getByLabelText(/Reject Application/i);
    fireEvent.click(rejectRadio);

    // Now the reason field should appear - wait for it
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Please provide a reason for rejection/i)).toBeInTheDocument();
    });

    const reasonField = screen.getByPlaceholderText(/Please provide a reason for rejection/i);
    const confirmButton = screen.getByText('Confirm Decision');

    // Try to submit without reason
    fireEvent.click(confirmButton);

    // Should not call onConfirm without a reason
    expect(mockOnConfirm).not.toHaveBeenCalled();

    // Add reason and submit
    fireEvent.change(reasonField, { target: { value: 'Does not meet income requirements' } });
    fireEvent.click(confirmButton);

    // Now it should call onConfirm
    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith({
        decision: 'reject',
        reason: 'Does not meet income requirements',
        scheduleViewing: false,
        leadId: '123'
      });
    });
  });

  it('allows acceptance without reason', async () => {
    render(
      <DecisionModal
        open={true}
        onClose={mockOnClose}
        application={mockApplication}
        onConfirm={mockOnConfirm}
      />
    );

    // Select accept option
    const acceptRadio = screen.getByLabelText(/Accept Application/i);
    fireEvent.click(acceptRadio);

    // Submit without reason (should work)
    const confirmButton = screen.getByText('Confirm Decision');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith({
        decision: 'accept',
        reason: '',
        scheduleViewing: false,
        leadId: '123'
      });
    });
  });

  it('handles scheduling for viewing', async () => {
    render(
      <DecisionModal
        open={true}
        onClose={mockOnClose}
        application={mockApplication}
        onConfirm={mockOnConfirm}
      />
    );

    // Select schedule viewing option
    const scheduleRadio = screen.getByLabelText(/Schedule for Viewing/i);
    fireEvent.click(scheduleRadio);

    // Should show info message
    expect(screen.getByText(/The applicant will be invited to schedule a viewing/i)).toBeInTheDocument();

    // Submit
    const confirmButton = screen.getByText('Confirm Decision');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith({
        decision: 'schedule_viewing',
        reason: '',
        scheduleViewing: false,
        leadId: '123'
      });
    });
  });

  it('closes modal on cancel', () => {
    render(
      <DecisionModal
        open={true}
        onClose={mockOnClose}
        application={mockApplication}
        onConfirm={mockOnConfirm}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles missing application data gracefully', () => {
    const incompleteApplication = {
      id: '456',
      // Missing name and score
      status: 'pending'
    };

    render(
      <DecisionModal
        open={true}
        onClose={mockOnClose}
        application={incompleteApplication}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText('Anonymous')).toBeInTheDocument();
    expect(screen.getByText('0/100')).toBeInTheDocument();
  });
});