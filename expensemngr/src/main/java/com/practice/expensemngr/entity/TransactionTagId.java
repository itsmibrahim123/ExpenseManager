package com.practice.expensemngr.entity;

import java.io.Serializable;
import java.util.Objects;

public class TransactionTagId implements Serializable {
    private Long transactionId;
    private Long tagId;

    public TransactionTagId() {}

    public TransactionTagId(Long transactionId, Long tagId) {
        this.transactionId = transactionId;
        this.tagId = tagId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TransactionTagId)) return false;
        TransactionTagId that = (TransactionTagId) o;
        return Objects.equals(transactionId, that.transactionId) &&
                Objects.equals(tagId, that.tagId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(transactionId, tagId);
    }
}
