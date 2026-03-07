const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// Get all payments for a user
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments'
    });
  }
});

// Create new payment
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      announcement_id,
      amount,
      payment_method,
      purpose,
      transaction_id,
      gateway_response
    } = req.body;

    if (!user_id || !announcement_id || !amount || !payment_method) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: user_id, announcement_id, amount, payment_method'
      });
    }

    const paymentData = {
      user_id,
      announcement_id,
      amount: parseFloat(amount),
      payment_method,
      purpose: purpose || 'verification',
      transaction_id: transaction_id || null,
      gateway_response: gateway_response || null
    };

    const { data, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: data
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment'
    });
  }
});

module.exports = router;
