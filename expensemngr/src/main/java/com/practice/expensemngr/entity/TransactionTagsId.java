package io.saadmughal.assignment05.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Objects;

/**
 * Composite key for TransactionTags entity
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionTagsId implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long transactionId;
    private Long tagId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TransactionTagsId that = (TransactionTagsId) o;
        return Objects.equals(transactionId, that.transactionId) &&
                Objects.equals(tagId, that.tagId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(transactionId, tagId);
    }
}